import { useState, useEffect, useRef } from "react";

function App() {
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  // Cargar datos
  useEffect(() => {
    const stored = localStorage.getItem("studyData");
    if (stored) setSubjects(JSON.parse(stored));
  }, []);

  // Guardar datos
  useEffect(() => {
    localStorage.setItem("studyData", JSON.stringify(subjects));
  }, [subjects]);

  // Cronómetro
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const addSubject = () => {
    if (!newSubject.trim()) return;

    const subject = {
      id: Date.now(),
      name: newSubject,
      sessions: [],
    };

    setSubjects([...subjects, subject]);
    setNewSubject("");
  };

  const startSession = (subject) => {
    setSelectedSubject(subject);
    setSeconds(0);
    setIsRunning(true);
  };

  const stopSession = () => {
    setIsRunning(false);
    if (seconds === 0) return;

    const updated = subjects.map((sub) =>
      sub.id === selectedSubject.id
        ? {
            ...sub,
            sessions: [
              ...sub.sessions,
              {
                duration: seconds,
                date: new Date().toLocaleString(),
              },
            ],
          }
        : sub
    );

    setSubjects(updated);
    setSelectedSubject(null);
    setSeconds(0);
  };

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getTotalTime = (sessions) =>
    sessions.reduce((acc, s) => acc + s.duration, 0);

  return (
    <>
      <style>{`
        body {
          margin: 0;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          background: linear-gradient(180deg, #630b0b 0%, #ff0000 100%);
        }

          .card h3 {
           color: #810000;
          }

        .container {
          max-width: 480px;
          margin: 0 auto;
          padding: 40px 20px 60px;
          min-height: 100vh;
        }

        .header {
          margin-bottom: 30px;
        }

        .header h1 {
          color: white;
          font-size: 2.4rem;
          margin: 0;
          font-weight: 700;
        }

        .header p {
          color: rgb(255, 255, 255);
          margin-top: 6px;
          font-size: 0.95rem;
        }

        .card {
          background: white;
          padding: 22px;
          border-radius: 18px;
          box-shadow: 0 15px 35px rgba(247, 0, 0, 0.15);
          margin-bottom: 18px;
          transition: transform 0.2s ease;
        }

        .card:hover {
          transform: translateY(-2px);
        }

        .input-group {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        input {
          flex: 1;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #770000;
          font-size: 0.95rem;
          outline: none;
          transition: border 0.2s ease;
        }

        input:focus {
          border-color: #eb2525;
        }

        button {
          padding: 12px 18px;
          border-radius: 12px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .primary {
          background: #680000;
          color: white;
        }

        .primary:hover {
          background: #700000;
        }

        .danger {
          background: #960303;
          color: white;
        }

        .danger:hover {
          background: #dc2626;
        }

        .subject-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
        }

        .subject-info h3 {
          margin: 0;
          font-size: 1.1rem;
        }

        .subject-info p {
          margin: 4px 0 0;
          font-size: 0.85rem;
          color: #6b7280;
        }

        .timer-display {
          font-size: 3.2rem;
          font-weight: 700;
          text-align: center;
          margin: 25px 0;
          color: #8a1e1e;
        }

        .button-group {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        @media (max-width: 480px) {
          .container {
            padding: 30px 15px 50px;
          }

          .timer-display {
            font-size: 2.4rem;
          }

          .subject-card {
            flex-direction: column;
            align-items: stretch;
          }

          button {
            width: 100%;
          }
        }
      `}</style>

      <div className="container">
        <div className="header">
          <h1>StudyTrack</h1>
          <p>Controla tu tiempo de estudio por materia</p>
        </div>

        {!selectedSubject && (
          <>
            <div className="card">
              <h3>Agregar Materia</h3>
              

              <div className="input-group">
                <input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Nombre de la materia"
                />
                <button className="primary" onClick={addSubject}>
                  Agregar
                </button>
              </div>
            </div>

            {subjects.map((sub) => (
              <div className="card subject-card" key={sub.id}>
                <div className="subject-info">
                  <h3>{sub.name}</h3>
                  <p>
                    Total estudiado: {formatTime(
                      getTotalTime(sub.sessions)
                    )}
                  </p>
                </div>
                <button
                  className="primary"
                  onClick={() => startSession(sub)}
                >
                  Iniciar sesión
                </button>
              </div>
            ))}
          </>
        )}

        {selectedSubject && (
          <div className="card">
            <h2 style={{ textAlign: "center" }}>
              {selectedSubject.name}
            </h2>

            <div className="timer-display">
              {formatTime(seconds)}
            </div>

            <div className="button-group">
              {!isRunning && (
                <button
                  className="primary"
                  onClick={() => setIsRunning(true)}
                >
                  Continuar
                </button>
              )}

              {isRunning && (
                <button
                  className="primary"
                  onClick={() => setIsRunning(false)}
                >
                  Pausar
                </button>
              )}

              <button className="danger" onClick={stopSession}>
                Finalizar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;