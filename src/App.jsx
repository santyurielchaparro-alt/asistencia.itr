import { useState, useEffect } from "react";
import "./App.css";

// ---------- Datos ----------
const CURSOS = ["4° Mecánica", "4° Programación"];

// estado "" = sin marcar (así arranca cada día)
const ALUMNOS_INICIALES = {
  "4° Mecánica": [
    { dni: "45123456", nombre: "Gómez, Lucas", estado: "", obs: "" },
    { dni: "45234567", nombre: "Fernández, Mía", estado: "", obs: "" },
    { dni: "45345678", nombre: "Rodríguez, Iván", estado: "", obs: "" },
    { dni: "45456789", nombre: "Pérez, Sofía", estado: "", obs: "" },
    { dni: "45567890", nombre: "Torres, Benjamín", estado: "", obs: "" },
  ],
  "4° Programación": [
    { dni: "45678901", nombre: "Acosta, Martina", estado: "", obs: "" },
    { dni: "45789012", nombre: "Benítez, Joaquín", estado: "", obs: "" },
    { dni: "45890123", nombre: "Córdoba, Valentina", estado: "", obs: "" },
    { dni: "45901234", nombre: "Díaz, Facundo", estado: "", obs: "" },
    { dni: "46012345", nombre: "Molina, Camila", estado: "", obs: "" },
  ],
};

const STATS_INICIALES = { presentes: 0, ausentes: 0, tardanzas: 0 };

// El orden importa: las teclas 1-4 y las flechas ← → siguen este orden
const ESTADOS = [
  { key: "presente", label: "Presente" },
  { key: "ausente", label: "Ausente" },
  { key: "justificado", label: "Justif." },
  { key: "tardanza", label: "Tarde" },
];

// ---------- Guardado por día ----------
// Cada día tiene su propia clave (ej: "asistencia-2026-10-14").
// Si ya hay datos de hoy, se recuperan; si es un día nuevo, arranca en blanco.
const CLAVE_HOY = "asistencia-" + new Date().toLocaleDateString("en-CA");

function cargarDelDia() {
  try {
    const guardado = localStorage.getItem(CLAVE_HOY);
    if (guardado) return JSON.parse(guardado);
  } catch (error) {
    // si falla la lectura, se arranca en blanco
  }
  return { alumnos: ALUMNOS_INICIALES, stats: STATS_INICIALES };
}

function App() {
  const [curso, setCurso] = useState(CURSOS[0]);
  const [alumnos, setAlumnos] = useState(() => cargarDelDia().alumnos);
  const [stats, setStats] = useState(() => cargarDelDia().stats);
  const [busqueda, setBusqueda] = useState("");

  // Fila resaltada de la tabla (para usar el teclado)
  const [filaActiva, setFilaActiva] = useState(0);

  // Mensaje chico abajo de la pantalla (reemplaza a los alert)
  const [aviso, setAviso] = useState("");

  // Ventana flotante de "Reportar errores"
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [textoReporte, setTextoReporte] = useState("");

  const fecha = new Date().toLocaleDateString("es-AR");

  // Alumnos del curso elegido, filtrados por DNI o apellido
  const alumnosFiltrados = alumnos[curso].filter(
    (a) =>
      a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      a.dni.includes(busqueda)
  );

  // Si la lista queda más corta (por el buscador), la fila activa no se pasa
  const fila = Math.min(filaActiva, alumnosFiltrados.length - 1);

  // Cada vez que cambia algo, se guarda en el día de hoy
  useEffect(() => {
    localStorage.setItem(CLAVE_HOY, JSON.stringify({ alumnos, stats }));
  }, [alumnos, stats]);

  // El aviso se borra solo a los 2,5 segundos
  useEffect(() => {
    if (aviso === "") return;
    const timer = setTimeout(() => setAviso(""), 2500);
    return () => clearTimeout(timer);
  }, [aviso]);

  // La fila activa siempre se mantiene a la vista
  useEffect(() => {
    const el = document.querySelector("tr.activa");
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }, [fila, curso]);

  function cambiarEstado(dni, nuevoEstado) {
    setAlumnos({
      ...alumnos,
      [curso]: alumnos[curso].map((a) =>
        a.dni === dni ? { ...a, estado: nuevoEstado } : a
      ),
    });
  }

  function cambiarObs(dni, texto) {
    setAlumnos({
      ...alumnos,
      [curso]: alumnos[curso].map((a) =>
        a.dni === dni ? { ...a, obs: texto } : a
      ),
    });
  }

  function guardarAsistencia() {
    const lista = alumnos[curso];
    const total = lista.length;
    const contar = (e) => lista.filter((a) => a.estado === e).length;
    const pct = (n) => Math.round((n / total) * 100);

    // Aviso antes de guardar si falta marcar a alguien
    const sinMarcar = contar("");
    if (
      sinMarcar > 0 &&
      !window.confirm(`Quedan ${sinMarcar} alumno(s) sin marcar. ¿Guardar igual?`)
    ) {
      return;
    }

    setStats({
      presentes: pct(contar("presente")),
      ausentes: pct(contar("ausente") + contar("justificado")),
      tardanzas: pct(contar("tardanza")),
    });
    setAviso("Asistencia guardada correctamente.");
  }

  function enviarReporte() {
    if (textoReporte.trim() === "") {
      setAviso("Escribí el error antes de enviar.");
      return;
    }
    // Por ahora se guarda en el navegador (no hay servidor todavía)
    const reportes = JSON.parse(localStorage.getItem("reportes-errores") || "[]");
    reportes.push({ fecha: new Date().toLocaleString("es-AR"), texto: textoReporte });
    localStorage.setItem("reportes-errores", JSON.stringify(reportes));

    setTextoReporte("");
    setMostrarReporte(false);
    setAviso("Gracias, el reporte fue registrado.");
  }

  // ---------- Atajos de teclado ----------
  // ↑ ↓ / W S : mover la fila activa
  // ← → / A D : cambiar el estado del alumno activo
  // 1 2 3 4   : marcar Presente / Ausente / Justif. / Tarde y pasar al siguiente
  // O         : ir a observaciones      Esc: salir del campo / cerrar ventana
  // Enter     : guardar la asistencia
  useEffect(() => {
    function alPresionar(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Escape") {
        if (mostrarReporte) setMostrarReporte(false);
        else if (document.activeElement) document.activeElement.blur();
        return;
      }

      // Con la ventana de errores abierta, el teclado queda para escribir
      if (mostrarReporte) return;

      // Si se está escribiendo en un campo, los atajos no se activan
      const etiqueta = e.target.tagName;
      if (etiqueta === "INPUT" || etiqueta === "TEXTAREA" || etiqueta === "SELECT") {
        return;
      }

      const tecla = e.key.toLowerCase();
      const alumno = alumnosFiltrados[fila];
      const ultima = alumnosFiltrados.length - 1;

      if (tecla === "arrowup" || tecla === "w") {
        e.preventDefault();
        setFilaActiva(Math.max(fila - 1, 0));
      } else if (tecla === "arrowdown" || tecla === "s") {
        e.preventDefault();
        setFilaActiva(Math.max(Math.min(fila + 1, ultima), 0));
      } else if (
        alumno &&
        (tecla === "arrowleft" || tecla === "a" || tecla === "arrowright" || tecla === "d")
      ) {
        e.preventDefault();
        const actual = ESTADOS.findIndex((x) => x.key === alumno.estado);
        const paso = tecla === "arrowright" || tecla === "d" ? 1 : -1;
        const nuevo =
          actual === -1 ? 0 : Math.min(Math.max(actual + paso, 0), ESTADOS.length - 1);
        cambiarEstado(alumno.dni, ESTADOS[nuevo].key);
      } else if (alumno && ["1", "2", "3", "4"].includes(tecla)) {
        e.preventDefault();
        cambiarEstado(alumno.dni, ESTADOS[Number(tecla) - 1].key);
        setFilaActiva(Math.min(fila + 1, ultima));
      } else if (alumno && tecla === "o") {
        e.preventDefault();
        const campo = document.querySelector("tr.activa .obs-input");
        if (campo) campo.focus();
      } else if (tecla === "enter") {
        // Si el foco está en un botón "grande" o en un link, que actúe normal
        if (e.target.closest(".btn, a")) return;
        e.preventDefault();
        if (!e.repeat) guardarAsistencia();
      }
    }

    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  });

  return (
    <div className="app">
      {/* ---------- HEADER (fijo arriba) ---------- */}
      <header className="header">
        <div className="header-controles">
          <select
            value={curso}
            onChange={(e) => {
              setCurso(e.target.value);
              setFilaActiva(0);
              e.target.blur();
            }}
          >
            {CURSOS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Buscar alumno por DNI o apellido..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setFilaActiva(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.target.blur();
            }}
          />
        </div>

        <div className="header-info">
          {/* LOGO: para poner el logo real, guardá la imagen en la carpeta
              "public" (ej: public/logo-itr.png) y reemplazá el div de abajo por:
              <img className="logo" src="/logo-itr.png" alt="Logo ITR" /> */}
          <div className="logo-placeholder">LOGO</div>

          <div className="header-texto">
            <h1>Sistema de Control de Asistencia - ITR</h1>
            <p>Preceptoría | {fecha}</p>
          </div>
        </div>
      </header>

      <div className="contenido">
        {/* ---------- SIDEBAR ---------- */}
        <aside className="sidebar">
          <button
            className="btn btn-primario"
            onClick={() => document.getElementById("tabla").scrollIntoView()}
          >
            Tomar Asistencia del Día
          </button>
          <button
            className="btn btn-secundario"
            onClick={() => setAviso("Función en construcción.")}
          >
            Registrar Retiro Anticipado
          </button>
          <button
            className="btn btn-neutro"
            onClick={() => setAviso("Función en construcción.")}
          >
            Consultar Historial / Reportes
          </button>

          <div className="stat stat-presentes">
            <p>Presentes</p>
            <strong>{stats.presentes}%</strong>
          </div>
          <div className="stat stat-ausentes">
            <p>Ausentes</p>
            <strong>{stats.ausentes}%</strong>
          </div>
          <div className="stat stat-tardanzas">
            <p>Tardanzas</p>
            <strong>{stats.tardanzas}%</strong>
          </div>

          <a
            className="link-errores"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setMostrarReporte(true);
            }}
          >
            Reportar errores en el sistema
          </a>
        </aside>

        {/* ---------- PRINCIPAL ---------- */}
        <main className="principal" id="tabla">
          <div className="banner">Asistencia de Hoy — Curso: {curso}</div>

          <p className="leyenda">
            <strong>Atajos:</strong> ↑ ↓ (o W S) mover · ← → (o A D) cambiar estado ·
            1 Presente, 2 Ausente, 3 Justif., 4 Tarde (y pasa al siguiente) ·
            O observaciones · Esc salir · Enter guardar
          </p>

          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Nombre y Apellido</th>
                <th>Estado</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {alumnosFiltrados.map((alumno, i) => (
                <tr
                  key={alumno.dni}
                  className={i === fila ? "activa" : ""}
                  onClick={() => setFilaActiva(i)}
                >
                  <td>{String(i + 1).padStart(2, "0")}</td>
                  <td>{alumno.nombre}</td>
                  <td>
                    {ESTADOS.map((e) => (
                      <button
                        key={e.key}
                        className={
                          "estado-btn " +
                          e.key +
                          (alumno.estado === e.key ? " selected" : "")
                        }
                        aria-pressed={alumno.estado === e.key}
                        onClick={() => cambiarEstado(alumno.dni, e.key)}
                      >
                        {e.label}
                      </button>
                    ))}
                  </td>
                  <td>
                    <input
                      className="obs-input"
                      type="text"
                      placeholder="Sin observaciones"
                      value={alumno.obs}
                      onChange={(e) => cambiarObs(alumno.dni, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pie-tabla">
            <button
              className="btn btn-primario btn-guardar"
              onClick={guardarAsistencia}
            >
              Guardar Asistencia
            </button>
          </div>
        </main>
      </div>

      {/* ---------- VENTANA FLOTANTE: REPORTAR ERRORES ---------- */}
      {mostrarReporte && (
        <div className="modal-fondo" onClick={() => setMostrarReporte(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Reportar un error</h2>
            <p>Contanos qué pasó para que lo podamos revisar.</p>
            <textarea
              rows="5"
              placeholder="Describí el error..."
              value={textoReporte}
              onChange={(e) => setTextoReporte(e.target.value)}
              autoFocus
            />
            <div className="modal-botones">
              <button
                className="btn btn-neutro"
                onClick={() => setMostrarReporte(false)}
              >
                Cancelar
              </button>
              <button className="btn btn-primario" onClick={enviarReporte}>
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- AVISO ---------- */}
      {aviso && <div className="aviso">{aviso}</div>}
    </div>
  );
}

export default App;
