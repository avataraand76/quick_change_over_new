// frontend/src/contexts/AuthContextDefinition.js
//
// Tách riêng createContext khỏi AuthContext.jsx để file .jsx chỉ export
// component - giữ cho react-refresh (HMR) hoạt động đúng.

import { createContext } from "react";

export const AuthContext = createContext(null);
