import React, { createContext, useState } from "react";

export const ErrorContext = createContext();

export function ErrorProvider({ children }) {
  const [errorMessage, setErrorMessage] = useState('');

  return (
    <ErrorContext.Provider value={[errorMessage, setErrorMessage]}>
      {children}
    </ErrorContext.Provider>
  )
}