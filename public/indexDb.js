let db;

const request = indexedDB.open("budget", 1);

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const budgetStore = db.createObjectStore("budget", { autoIncrement: true });
  budgetStore.createIndex("pendingIndex", "pending");
};

request.onerror = (event) => {
  console.log(`There was a problem retrieving your data: ${request.error}`);
};

request.onsuccess = (event) => {
  db = event.target.result;
  if (navigator.onLine) {
    checkDatabase();
  }
};

function saveRecord(record) {
  const transaction = db.transaction(["budget"], "readwrite");
  const budgetStore = transaction.objectStore("budget");
  budgetStore.add(record);
}

function checkDatabase() {
  const transaction = db.transaction(["budget"], "readwrite");
  const budgetStore = transaction.objectStore("budget");
  const getRequest = budgetStore.getAll();

  getRequest.onsuccess = function () {
    if (getRequest.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getRequest.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then(() => {
          const transaction = db.transaction(["budget"], "readwrite");
          const budgetStore = transaction.objectStore("budget");
          budgetStore.clear();
        });
    }
  };
}

window.addEventListener("online", checkDatabase);
