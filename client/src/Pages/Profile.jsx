import React from "react";
import { useAuth } from "../../src/Context/useAuth";
import { useAuth0 } from '@auth0/auth0-react';
const Profile = () => {
    const{role}=useAuth();
const {user}=useAuth0();
  return (
    <div className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md text-center">
      <img
        src={ role=="manager"?"https://www.shutterstock.com/image-vector/man-character-face-avatar-glasses-600nw-542759665.jpg":"https://png.pngtree.com/png-clipart/20231024/original/pngtree-illustration-of-a-female-doctor-for-profile-picture-png-image_13409385.png"}
        alt="Profile"
        className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
      />
      <h2 className="text-xl font-semibold text-gray-800">{user.email}</h2>
      <p className="text-gray-600 capitalize">{role || "No role specified"}</p>
    </div>
  );
};

export default Profile;