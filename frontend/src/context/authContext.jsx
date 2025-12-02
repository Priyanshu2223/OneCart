import React, { createContext } from "react";

export const authDataContext = createContext();

function AuthContext({ children }) {
  // Backend already deployed → correct!
  const serverUrl = "https://onecart-backend-ag6p.onrender.com";

  return (
    <authDataContext.Provider value={{ serverUrl }}>
      {children}
    </authDataContext.Provider>
  );
}

export default AuthContext;
