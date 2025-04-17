const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const axios = require("axios");
const { PrismaClient } = require("./prisma/generated/client");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const GraphQLJSON = require("graphql-type-json");
const dayjs = require("dayjs");
const timezone = require("dayjs/plugin/timezone");
const utc = require("dayjs/plugin/utc");

dayjs.extend(utc);
dayjs.extend(timezone);
const prisma = new PrismaClient();
const { getDistance } = require("geolib");
const app = express();
app.use(cors());

// Middleware to verify JWT (simplified version of authMiddleware)
const authMiddleware = (req) => {
  const token = req;
  console.log(token);
  if (!token) throw new Error("No token provided");
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "abhishek@0101");
  } catch (error) {
    // Handle JWT verification errors (e.g., token expired, invalid signature)
    console.error("JWT Verification Error:", error);
    throw new Error("Invalid token"); // Or a more specific error like "InvalidTokenError"
  }
};

const typeDefs = `
scalar JSON

type WeeklyShiftSummary {
  period: WeekPeriod!
  averageHoursPerDay: JSON!
  uniqueUsers: UniqueUsers!
  totalHoursPerEmployee: JSON!
  totalWeekHours: Float!
}

type WeekPeriod {
  start: String!
  end: String!
}

type UniqueUsers {
  count: Int!
  users: [UserSummary!]!
}

type UserSummary {
  id: ID!
  name: String!
}

extend type Query {
  weeklyShiftSummary: WeeklyShiftSummary!
}

type User {
  id: ID!
  name: String!
  email: String!
  role: String!
  createdAt: String!
shifts: [Shift!]!
}

 type Shift {
  id: ID!
  userId: ID!
  date: String!
  clockInTime: String!
  clockInNote: String
  clockInLocationLat: Float
  clockInLocationLng: Float
  clockOutTime: String
  clockOutNote: String
  clockOutLocationLat: Float
  clockOutLocationLng: Float
}

  type Location {
    id: ID!
    perimeter: Int!
    latitude: Float!
    longitude: Float!
    createdAt: String
  }
type UserWithToken {
  user_id: ID!
  role: String!
  token: String!
}

  type Query {
    shifts: [Shift!]!
    shiftsByUser(userId: ID!): [Shift!]!
    users: [User!]!
    user(id: ID!): User
    location: [Location!]!
    shiftsToday:[Shift!]
  }

  type Mutation {

  clockIn(userId: ID!, clockInNote: String, lat: Float!, lng: Float!): Shift!

    setLocationPerimeter(perimeter: Int!, latitude: Float!, longitude: Float!): Location
    clockOut(userId: ID!, clockOutNote: String, lat: Float!, lng: Float!): Shift!
  createUser(name: String!, email: String!, password: String, role: String): UserWithToken!

  }
`;

// GraphQL Resolvers
const resolvers = {
  JSON: GraphQLJSON,
  Shift: {
    date: (shift) => {
      return dayjs(shift.date).tz("Asia/Kolkata").format("YYYY-MM-DD");
    },
  },
  User: {
    shifts: async (userId) =>
      await prisma.shift.findMany({ where: { userId } }),
  },
  Query: {
    shifts: async () =>
      await prisma.shift.findMany({ include: { user: true } }),
    users: async () => await prisma.user.findMany(),
    user: async (_, { id }) => await prisma.user.findUnique({ where: { id } }),
    location: async () => await prisma.location.findMany(),
    shiftsByUser: async (_parent, { userId }, _context) => {
      const shifts = await prisma.shift.findMany({
        where: { userId },
        orderBy: [{ date: "desc" }, { clockInTime: "desc" }],
      });
      return shifts;
    },
    weeklyShiftSummary: async (_parent, _args) => {
      console.log("weekly shifts called ");
      const today = new Date();

      // Get last Monday (start of previous week)
      const lastMonday = new Date(today);
      lastMonday.setDate(today.getDate() - today.getDay() - 6);

      // Get last Sunday (end of previous week)
      const lastSunday = new Date(today);
      lastSunday.setDate(today.getDate() - today.getDay());

      const shifts = await prisma.shift.findMany({
        where: {
          date: {
            gte: lastMonday,
            lte: lastSunday,
          },
        },
        include: {
          user: true,
        },
      });

      let totalHours = 0;
      const hoursPerDay = {};
      const usersPerDay = {};
      const hoursPerStaff = {};
      const uniqueUsersLastWeek = new Set();

      shifts.forEach((shift) => {
        if (shift.clockOutTime && shift.clockInTime) {
          const [inHours, inMinutes] = shift.clockInTime.split(":").map(Number);
          const [outHours, outMinutes] = shift.clockOutTime
            .split(":")
            .map(Number);

          const clockIn = new Date(shift.date);
          clockIn.setHours(inHours, inMinutes, 0, 0);

          const clockOut = new Date(shift.date);
          clockOut.setHours(outHours, outMinutes, 0, 0);

          if (clockOut < clockIn) {
            clockOut.setDate(clockOut.getDate() + 1); // overnight
          }

          const hoursWorked =
            (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
          totalHours += hoursWorked;

          const shiftDate = shift.date.toISOString().split("T")[0];

          hoursPerDay[shiftDate] = (hoursPerDay[shiftDate] || 0) + hoursWorked;

          if (!usersPerDay[shiftDate]) usersPerDay[shiftDate] = new Set();
          usersPerDay[shiftDate].add(shift.userId);

          const userId = shift.userId;
          hoursPerStaff[userId] = {
            hours: (hoursPerStaff[userId]?.hours || 0) + hoursWorked,
            name: shift.user.name,
          };

          uniqueUsersLastWeek.add(userId);
        }
      });

      const avgHoursPerDay = {};
      for (const date in hoursPerDay) {
        const numPeople = usersPerDay[date].size;
        avgHoursPerDay[date] = hoursPerDay[date] / numPeople;
      }

      return {
        period: {
          start: lastMonday.toISOString().split("T")[0],
          end: lastSunday.toISOString().split("T")[0],
        },
        averageHoursPerDay: avgHoursPerDay,
        uniqueUsers: {
          count: uniqueUsersLastWeek.size,
          users: Array.from(uniqueUsersLastWeek).map((userId) => ({
            id: userId,
            name: hoursPerStaff[userId]?.name || "Unknown",
          })),
        },
        totalHoursPerEmployee: Object.fromEntries(
          Object.entries(hoursPerStaff).map(([userId, data]) => [
            userId,
            {
              name: data.name,
              hours: parseFloat(data.hours.toFixed(2)),
            },
          ])
        ),
        totalWeekHours: parseFloat(totalHours.toFixed(2)),
      };
    },
    shiftsToday: async (_parent, _args, _context) => {
      // Get the start and end of today in ISO format
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const shifts = await prisma.shift.findMany({
        where: {
          date: {
            gte: startOfDay, // Start of today
            lte: endOfDay, // End of today
          },
        },
        orderBy: [
          { date: "desc" },
          { clockInTime: "desc" }, // Most recent shifts first
        ],
      });

      return shifts;
    },
  },
  Mutation: {
    clockIn: async (_, { userId, clockInNote, lat, lng }, context) => {
      try {
        // 1. Fetch location perimeter
        const locationPerimeter = await prisma.location.findFirst();
        if (!locationPerimeter) {
          throw new Error("Location perimeter not set");
        }

        const distance = getDistance(
          { latitude: lat, longitude: lng },
          {
            latitude: locationPerimeter.lat,
            longitude: locationPerimeter.lon,
          }
        );

        console.log(distance);
        if (distance > locationPerimeter.perimeter) {
          throw new Error("You are outside the allowed perimeter");
        }

        const activeShift = await prisma.shift.findFirst({
          where: {
            userId: userId,
            clockOutTime: null,
          },
        });

        if (activeShift) {
          throw new Error(
            "You already have an active shift. Please clock out first."
          );
        }

        // 4. Create shift
        const currentDate = new Date();
        const dateOnly = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate()
        );

        const istTime = dayjs().tz("Asia/Kolkata").format("HH:mm");

        const shift = await prisma.shift.create({
          data: {
            userId: userId,
            date: dateOnly,
            clockInTime: istTime,
            clockInNote: clockInNote || null,
            clockInLocationLat: lat,
            clockInLocationLng: lng,
            clockOutNote: null,
            clockOutTime: null,
            clockOutLocationLat: null,
            clockOutLocationLng: null,
          },
        });

        return shift;
      } catch (err) {
        console.error("Clock-in error:", err);
        throw new Error(err.message || "Server error");
      }
    },
    createUser: async (_, { name, email, password, role }) => {
      try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          const payload = {
            user: { id: existingUser.id, role: existingUser.role },
          };
          const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || "abhishek@0101"
          );
          return {
            user_id: existingUser.id,
            role: existingUser.role,
            token,
          };
        } else {
          const newUser = await prisma.user.create({
            data: { name, email, password, role: role || "careworker" }, // role
          });
          const payload = { user: { id: newUser.id, role: newUser.role } };
          const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || "abhishek@0101"
          );
          return {
            user_id: newUser.id,
            role: newUser.role,
            token,
          };
        }
      } catch (error) {
        console.error("Error in createUser resolver:", error);
        throw new Error("Failed to create or find user");
      }
    },
    setLocationPerimeter: async (_, { perimeter, latitude, longitude }) => {
      //     console.log(perimeter)
      //   const dbUser = await prisma.user.findUnique({ where: { id: user.user.id } });
      //   if (dbUser.role !== 'manager') throw new Error('Must be a manager');

      const existing = await prisma.location.findFirst();
      if (existing) {
        const data = await prisma.location.update({
          where: { id: existing.id },
          data: { lat: latitude, lon: longitude, perimeter },
        });
        return {
          id: data.id,
          perimeter: data.perimeter,
          latitude: data.lat,
          longitude: data.lon,
        };
      }

      const data = await prisma.location.create({
        data: { perimeter, lat: latitude, lon: longitude },
      });

      return {
        id: data.id,
        perimeter: data.perimeter,
        latitude: data.lat,
        longitude: data.lon,
      };
    },

    clockOut: async (_, { userId, clockOutNote, lat, lng }, { req }) => {
      //  const user = authMiddleware(req); // removed auth middleware
      //  const dbUser = await prisma.user.findUnique({ where: { id: user.user.id } }); // removed
      //  if (!dbUser) throw new Error('User not found'); // removed

      console.log("I am Clock Out");
      const locationPerimeter = await prisma.location.findFirst();
      if (!locationPerimeter) {
        throw new Error("Location perimeter not set");
      }

      // 2. Calculate distance from perimeter center
      const distance = getDistance(
        { latitude: lat, longitude: lng },
        {
          latitude: locationPerimeter.lat,
          longitude: locationPerimeter.lon,
        }
      );

      if (distance > locationPerimeter.perimeter) {
        throw new Error("You are outside the allowed perimeter");
      }

      const currshift = await prisma.shift.findFirst({
        where: {
          userId: userId,
          clockOutLocationLat: null,
          clockOutLocationLng: null,
        },
      });
      console.log(currshift);
      if (!currshift) {
        throw new Error("Shift not found");
      }

      if (currshift.clockOutTime) {
        throw new Error("Shift has already been clocked out");
      }
      const currentTime = new Date().toTimeString().slice(0, 5);
      return prisma.shift.update({
        where: { id: currshift.id },
        data: {
          clockOutTime: currentTime,
          clockOutLocationLat: lat,
          clockOutLocationLng: lng,
          clockOutNote: clockOutNote,
        },
      });
    },
  },
};

// Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    // You can now validate the token here
    return { token };
  },
});

const startServer = async () => {
  const { url } = await startStandaloneServer(server, {
    listen: { port: 3001 },
  });
  console.log(`🚀 GraphQL Server running at ${url}`);
};

startServer().catch((err) => console.error("Server startup error:", err));

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
