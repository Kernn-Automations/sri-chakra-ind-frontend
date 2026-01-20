export const logEvent = (type, details) => {
  const logs = JSON.parse(localStorage.getItem("logs")) || [];
  const newLog = {
    id: Date.now(),
    type,
    details,
    timestamp: new Date().toLocaleString(),
  };

  logs.push(newLog);
  localStorage.setItem("logs", JSON.stringify(logs));
};

