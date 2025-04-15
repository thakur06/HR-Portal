import React, { useState, useEffect } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";

const GET_SHIFTS_BY_USER = gql`
  query GetShiftsByUser($userId: ID!) {
    shiftsByUser(userId: $userId) {
      id
      date
      clockInTime
      clockOutTime
      clockInNote
      clockOutNote
      clockInLocationLat
      clockInLocationLng
      clockOutLocationLat
      clockOutLocationLng
    }
  }
`;

const CLOCK_IN = gql`
  mutation clockIn($userId: ID!, $clockInNote: String, $lat: Float!, $lng: Float!) {
    clockIn(userId: $userId, clockInNote: $clockInNote, lat: $lat, lng: $lng) {
      id
      date
      clockInTime
      clockInNote
      clockInLocationLat
      clockInLocationLng
    }
  }
`;

const CLOCK_OUT = gql`
  mutation clockOut($userId: ID!, $clockOutNote: String, $lat: Float!, $lng: Float!) {
    clockOut(userId: $userId, clockOutNote: $clockOutNote, lat: $lat, lng: $lng) {
      id
      date
      clockOutTime
      clockOutNote
      clockOutLocationLat
      clockOutLocationLng
    }
  }
`;

const Clock = () => {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [note, setNote] = useState("");
  const [clockedIn, setClockedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const userId = localStorage.getItem("user_id");

  
  const { data, loading, error } = useQuery(GET_SHIFTS_BY_USER, {
    variables: { userId },
  });

  useEffect(() => {
    
    navigator.geolocation.getCurrentPosition((position) => {
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
    });

   
    if (data && data.shiftsByUser) {
      setHistory(data.shiftsByUser);
      
      const latestShift = data.shiftsByUser[0];
      setClockedIn(latestShift && !latestShift.clockOutTime);
    }
  }, [data]); 

  const [clockIn, { loading: clockInLoading, error: clockInError }] = useMutation(CLOCK_IN);
  const [clockOut, { loading: clockOutLoading, error: clockOutError }] = useMutation(CLOCK_OUT);

  const handleClockIn = async () => {
    try {
      const { data } = await clockIn({
        variables: {
          userId,
          clockInNote: note,
          lat: parseFloat(latitude),
          lng: parseFloat(longitude),
        },
      });
    //   console.log("✅ Clocked in:", data.clockIn);
      setClockedIn(true);
      setHistory([data.clockIn, ...history]);
      setNote("");
      setMessage("Clocked in successfully.");
    } catch (err) {
    //   console.error("Clock in error:", err);
      setMessage("Error - You are Outside the allowed Parameter");
    }
  };

  const handleClockOut = async () => {
    try {
      const { data } = await clockOut({
        variables: {
          userId,
          clockOutNote: note,
          lat: parseFloat(latitude),
          lng: parseFloat(longitude),
        },
      });
    //   console.log("✅ Clocked out:", data.clockOut);
      setClockedIn(false);
      setHistory((prevHistory) =>
        prevHistory.map((entry) =>
          entry.id === data.clockOut.id
            ? { ...entry, ...data.clockOut }
            : entry
        )
      );
      setNote("");
      setMessage("Clocked out successfully.");
    } catch (err) {
    //   console.error("Clock out error:", err);
      setMessage("Error - You are Outside the allowed Parameter");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-center text-blue-700">Care Worker Clock In/Out</h2>

      <div className="mb-6 p-4 bg-gray-100 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">
          <strong className="font-medium">Latitude:</strong>{" "}
          {latitude || <span className="italic text-gray-500">Fetching...</span>}
        </p>
        <p className="text-sm text-gray-600">
          <strong className="font-medium">Longitude:</strong>{" "}
          {longitude || <span className="italic text-gray-500">Fetching...</span>}
        </p>
      </div>

      <form className="space-y-4">
        <div className="mb-4">
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
            Optional Note
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Add a note (optional)"
            rows="3"
          />
        </div>

        <div className="flex justify-center space-x-4">
          {!clockedIn ? (
            <button
              type="button"
              onClick={handleClockIn}
              disabled={clockInLoading || !latitude || !longitude}
              className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 disabled:bg-gray-400"
            >
              Clock In
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClockOut}
              disabled={clockOutLoading || !latitude || !longitude}
              className="w-full md:w-auto bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-200 disabled:bg-gray-400"
            >
              Clock Out
            </button>
          )}
        </div>
      </form>

      {message && (
        <div
          className={`mt-6 p-4 text-center text-white rounded-md ${
            message.includes("Error") ? "bg-red-500" : "bg-green-500"
          }`}
        >
          {message}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-blue-700">Clock In/Out History</h2>
        {history.length > 0 ? (
          <ul className="space-y-3">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="p-4 bg-gray-100 rounded-lg shadow-sm border border-gray-200"
              >
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <strong className="font-medium">Date:</strong> {entry.date}
                  </p>
                  <p className="text-gray-700">
                    <strong className="font-medium">Clock In:</strong> {entry.clockInTime}
                  </p>
                  <p className="text-gray-700">
                    <strong className="font-medium">Clock In Note:</strong>{" "}
                    {entry.clockInNote || "None"}
                  </p>
                  <p className="text-xs text-gray-500">
                    <strong className="font-medium">Clock In Location:</strong> (
                    {entry.clockInLocationLat}, {entry.clockInLocationLng})
                  </p>
                  <p className="text-gray-700">
                    <strong className="font-medium">Clock Out:</strong>{" "}
                    {entry.clockOutTime || (
                      <span className="italic text-red-500">Not clocked out</span>
                    )}
                  </p>
                  {entry.clockOutTime && (
                    <>
                      <p className="text-xs text-gray-500">
                        <strong className="font-medium">Clock Out Location:</strong> (
                        {entry.clockOutLocationLat}, {entry.clockOutLocationLng})
                      </p>
                      <p className="text-gray-700">
                        <strong className="font-medium">Clock Out Note:</strong>{" "}
                        {entry.clockOutNote || "None"}
                      </p>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-4 text-gray-500 italic">No clock in/out history found.</div>
        )}
      </div>
    </div>
  );
};

export { Clock };