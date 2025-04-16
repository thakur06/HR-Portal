import React,{useEffect,useState} from 'react'
import { useQuery, useMutation, gql } from "@apollo/client";
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../../src/Context/useAuth';

const CREATE_USER = gql`
  mutation CreateUser($name: String!, $email: String!, $password: String, $role: String) {
    createUser(name: $name, email: $email, password: $password, role: $role) {
      user_id
      role
      token
    }
  }
`;
export const Home = () => {
    const { isAuthenticated,user  } = useAuth0();

  const {login,role}=useAuth();
  
  const [createUser, { loading: createLoading, error: createError }] = useMutation(CREATE_USER, {
    onCompleted: (data) => {
      
      const { user_id, token, role } = data.createUser;
      login(user_id, token, role); // Store token in LiefContext
    },
  });


    if (isAuthenticated && user) {
      const getAccessTokenAndFetchRole = async () => {
        try {
          
          const name = user.name || user.nickname || user.given_name || "Unknown User";
          const variables = {
            name,
            email: user.email,
            role: "careworker",
            password: null,
          };
          await createUser({ variables });
        
        } catch (error) {
          console.error('Error getting access token:', error);
        }
      };
      getAccessTokenAndFetchRole();
    }
  

  return (
    <div>Home</div>
  )
}
