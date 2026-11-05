// Matrícula de un profesional en la Red. La declara la persona: TRAMA no la verifica.
export default function MatriculaMiembro({ matricula }) {
  if (typeof matricula !== 'string' || !matricula.trim()) return null
  return (
    <p className="mt-1 break-words text-sm text-texto-suave">
      Matrícula: <span className="font-semibold text-texto">{matricula}</span>
      <span className="block">Declarada por el profesional. TRAMA no la verifica.</span>
    </p>
  )
}
