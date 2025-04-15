import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { gql, useQuery} from '@apollo/client';
import { LifeLine } from 'react-loading-indicators';
const GET_SHIFTS_TODAY = gql`
  query GetShiftsToday {
    shiftsToday {
      id
      userId
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

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
    }
  }
`;

export const Logs = () => {
  const [userShifts, setUserShifts] = useState([]);

  const { data: shiftsData, loading: shiftsLoading, error: shiftsError } = useQuery(GET_SHIFTS_TODAY);
  const { data: usersData, loading: usersLoading } = useQuery(GET_USERS);

  const reverseGeocode = async (lat, lng) => {
    if (!lat || !lng) return 'Location data unavailable';
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.GOOGLE_API_KEY}`
      );
      return response.data.results && response.data.results.length > 0
        ? response.data.results[0].formatted_address
        : 'Address not found';
    } catch (err) {
      console.error('Error reverse geocoding:', err);
      return 'Error fetching address';
    }
  };

  useEffect(() => {
    const fetchShiftsWithAddresses = async () => {
      if (shiftsLoading || usersLoading) return;
      if (shiftsError) {
        setUserShifts([]);
        return;
      }
      if (shiftsData && shiftsData.shiftsToday && usersData && usersData.users) {
        try {
          const userMap = usersData.users.reduce((map, user) => {
            map[user.id] = user.name;
            return map;
          }, {});
          const shiftsWithAddresses = await Promise.all(
            shiftsData.shiftsToday.map(async (shift) => {
              const clockInAddress = await reverseGeocode(
                shift.clockInLocationLat,
                shift.clockInLocationLng
              );
              const clockOutAddress = shift.clockOutTime
                ? await reverseGeocode(
                    shift.clockOutLocationLat,
                    shift.clockOutLocationLng
                  )
                : 'Not clocked out yet';
              return {
                ...shift,
                user: { name: userMap[shift.userId] || 'Unknown' },
                clockInAddress,
                clockOutAddress,
              };
            })
          );
          setUserShifts(shiftsWithAddresses);
        } catch (err) {
          console.error('Error processing shifts:', err);
          setUserShifts([]);
        }
      }
    };

    fetchShiftsWithAddresses();
  }, [shiftsData, shiftsLoading, shiftsError, usersData, usersLoading]);

  if (shiftsLoading || usersLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (shiftsError) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        Error fetching shift data: {shiftsError.message}
      </div>
    );
  }

  return (
    <>
    {userShifts[0] ? <div className="container mx-auto p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-2xl font-semibold text-gray-800 mb-6">User Shift Logs</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Clock-in Time</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Clock-out Time</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Clock-in Location</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Clock-out Location</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Clock-in Note</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Clock-out Note</th>
            </tr>
          </thead>
          <tbody>
            {userShifts.map((shift) => (
              <tr key={shift.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 border-b text-sm text-gray-700">{shift.user.name}</td>
                <td className="px-4 py-3 border-b text-sm text-gray-700">{shift.clockInTime || 'N/A'}</td>
                <td
                  className={`px-4 py-3 border-b text-sm text-gray-700 ${
                    !shift.clockOutTime ? 'text-red-500 font-semibold' : ''
                  }`}
                >
                  {shift.clockOutTime || 'Not clocked out'}
                </td>
                <td className="px-4 py-3 border-b text-sm text-gray-700">{shift.clockInAddress}</td>
                <td className="px-4 py-3 border-b text-sm text-gray-700">{shift.clockOutAddress}</td>
                <td className="px-4 py-3 border-b text-sm text-gray-700">{shift.clockInNote || '-'}</td>
                <td className="px-4 py-3 border-b text-sm text-gray-700">{shift.clockOutNote || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>:<div className="flex items-center justify-center h-full">
  <LifeLine color="#cc3131" size="small" text="Loading" textColor="" />
</div>
    }</>
  );
};