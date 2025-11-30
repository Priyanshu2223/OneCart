import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { authDataContext } from './authContext';

export const userDataContext = createContext();

function UserContext({ children }) {
  const [userData, setUserData] = useState(undefined); 
  // undefined = loading, null = not logged in, object = logged in

  const { serverUrl } = useContext(authDataContext);

  const getCurrentUser = async () => {
    try {
      const res = await axios.get(serverUrl + "/api/user/getcurrentuser", {
        withCredentials: true,
      });

      setUserData(res.data);   // logged in
    } catch (err) {
      setUserData(null);       // not logged in
    }
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

  return (
    <userDataContext.Provider value={{ userData, setUserData, getCurrentUser }}>
      {children}
    </userDataContext.Provider>
  );
}

export default UserContext;
