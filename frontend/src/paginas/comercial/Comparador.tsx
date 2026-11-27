import { Navigate } from 'react-router-dom'

// El comparador verde vs. tostado vive en Compradores, junto al lote que se va a vender.
export default function Comparador() {
  return <Navigate to="/compradores#comparador" replace />
}
