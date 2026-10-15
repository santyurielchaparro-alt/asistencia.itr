# Sistema de Control de Asistencia - ITR
- **Código:** React + Vite

## Qué hace

- Elegir el curso y buscar alumnos por DNI o apellido.
- Marcar Presente / Ausente / Justificado / Tarde y escribir observaciones.
- Cada día arranca con la lista en blanco; lo marcado se conserva al recargar durante ese mismo día.
- "Guardar Asistencia" calcula los porcentajes de presentes, ausentes y tardanzas (avisa si quedan alumnos sin marcar).
- "Reportar errores" abre una ventana flotante para escribir el problema.
- Los botones de retiro anticipado e historial están en construcción (requieren un trabajo mayor).

## Atajos de teclado

| Tecla | Acción |
|---|---|
| ↑ ↓ o W S | Mover la fila activa |
| ← → o A D | Cambiar el estado del alumno activo |
| 1 / 2 / 3 / 4 | Marcar Presente / Ausente / Justif. / Tarde y pasar al siguiente |
| O | Ir a las observaciones del alumno activo |
| Esc | Salir de un campo o cerrar la ventana |
| Enter | Guardar la asistencia |

## Reflexión UX

Pasar el prototipo de Figma a código me mostró que un diseño estático deja muchas cosas sin definir. La versión en React mantiene lo esencial: el header, la paleta negro y amarillo del colegio, la barra lateral con los botones y la tabla de asistencia. Los cambios fueron por pura lógica: la tabla pasó a la pantalla principal para resolver todo en un solo lugar, y sumé un espacio para el logo institucional o de renault (que al momento de escribir esto no consegui aun), y una ventana para reportar errores. Al programar tuve que resolver casos que Figma no muestra: cómo se ve la lista al empezar el día, qué pasa al recargar la página o cómo se filtra por curso y por DNI. El flujo es claro y rápido: dos pasos en una sola pantalla, y con los atajos de teclado se toma lista sin usar el mouse. Para mejorarlo agregaría alta y baja de alumnos, retiros anticipados, un historial de asistencias y una base de datos.
