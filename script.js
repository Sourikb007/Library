
const books = [
  { title: "Introduction to Algorithms", author: "Thomas H. Cormen", subject: "Algorithms", isbn: "9780262046305", dept: "Computer Science", shelf: "CS-1, Row 2", status: "available" },
  { title: "Operating System Concepts", author: "Abraham Silberschatz", subject: "Operating Systems", isbn: "9781119800361", dept: "Computer Science", shelf: "CS-2, Row 1", status: "checked-out" },
  { title: "Database System Concepts", author: "Abraham Silberschatz", subject: "Databases", isbn: "9780078022159", dept: "Computer Science", shelf: "CS-2, Row 3", status: "available" },
  { title: "Computer Networking: A Top-Down Approach", author: "James F. Kurose", subject: "Computer Networks", isbn: "9780136681557", dept: "Computer Science", shelf: "CS-3, Row 1", status: "checked-out" },
  { title: "Fundamentals of Python", author: "", subject: "Python Programming", isbn: "", dept: "Computer Science", shelf: "CS-4, Row 1", status: "available" },

  { title: "Engineering Thermodynamics", author: "P. K. Nag", subject: "Thermodynamics", isbn: "9780070151314", dept: "Mechanical", shelf: "ME-1, Row 1", status: "available" },
  { title: "Fluid Mechanics", author: "Frank M. White", subject: "Fluid Mechanics", isbn: "9780073398273", dept: "Mechanical", shelf: "ME-1, Row 4", status: "checked-out" },
  { title: "Theory of Machines", author: "S. S. Rattan", subject: "Machine Design", isbn: "9789339205218", dept: "Mechanical", shelf: "ME-2, Row 2", status: "available" },
  { title: "Heat and Mass Transfer", author: "Yunus A. Cengel", subject: "Heat Transfer", isbn: "9780073398181", dept: "Mechanical", shelf: "ME-3, Row 1", status: "available" },

  { title: "Microelectronic Circuits", author: "Adel S. Sedra", subject: "Analog Electronics", isbn: "9780199339136", dept: "Electronics", shelf: "EC-1, Row 3", status: "available" },
  { title: "Digital Design", author: "M. Morris Mano", subject: "Digital Electronics", isbn: "9780134549897", dept: "Electronics", shelf: "EC-1, Row 5", status: "checked-out" },
  { title: "Signals and Systems", author: "Alan V. Oppenheim", subject: "Signal Processing", isbn: "9780138147570", dept: "Electronics", shelf: "EC-2, Row 2", status: "available" },
  { title: "Electronic Communication Systems", author: "Wayne Tomasi", subject: "Communication", isbn: "9780133351323", dept: "Electronics", shelf: "EC-3, Row 4", status: "checked-out" },

  { title: "Structural Analysis", author: "R. C. Hibbeler", subject: "Structures", isbn: "9780134610672", dept: "Civil", shelf: "CE-1, Row 2", status: "available" },
  { title: "Soil Mechanics and Foundations", author: "B. C. Punmia", subject: "Geotechnical", isbn: "9788131807903", dept: "Civil", shelf: "CE-1, Row 4", status: "available" },
  { title: "Surveying", author: "B. C. Punmia", subject: "Surveying", isbn: "9788131809853", dept: "Civil", shelf: "CE-2, Row 1", status: "checked-out" },
  { title: "Water Supply Engineering", author: "S. K. Garg", subject: "Environmental Engineering", isbn: "9788174090256", dept: "Civil", shelf: "CE-3, Row 3", status: "available" },

  { title: "Principles of Marketing", author: "Philip Kotler", subject: "Marketing", isbn: "9780135792360", dept: "Management", shelf: "MG-1, Row 1", status: "available" },
  { title: "Financial Management", author: "I. M. Pandey", subject: "Finance", isbn: "9789325982130", dept: "Management", shelf: "MG-1, Row 3", status: "checked-out" },
  { title: "Organizational Behavior", author: "Stephen P. Robbins", subject: "Human Resources", isbn: "9780134729329", dept: "Management", shelf: "MG-2, Row 2", status: "available" },
  { title: "Operations Management", author: "Jay Heizer", subject: "Operations", isbn: "9780134130422", dept: "Management", shelf: "MG-2, Row 4", status: "available" }
];

const departments = ["Computer Science", "Mechanical", "Electronics", "Civil", "Management"];
const HOLD_HOURS = 24;
const MAX_HOLDS = 3;
const MAX_DAYS = 15;
const FINE_PER_DAY = 10;
const ONE_DAY = 24 * 60 * 60 * 1000;


const $ = id => document.getElementById(id);
const searchInput = $("searchInput");
const searchField = $("searchField");
const statusFilter = $("statusFilter");
const dialog = $("reserveDialog");
const reserveForm = $("reserveForm");
const successBox = $("successBox");


let selectedDept = "All";
let selectedIsbn = null;
let reservations = JSON.parse(localStorage.getItem("reservations") || "[]");


const save = () => localStorage.setItem("reservations", JSON.stringify(reservations));
const findHold = isbn => reservations.find(r => r.isbn === isbn);
const getBook = isbn => books.find(b => b.isbn === isbn);
const plural = (n, word) => n + " " + word + (n === 1 ? "" : "s");

function daysLate(hold) {
  if (hold.state !== "borrowed" || Date.now() <= hold.dueAt) return 0;
  return Math.ceil((Date.now() - hold.dueAt) / ONE_DAY);
}

function timeLeft(time) {
  const mins = Math.max(0, Math.floor((time - Date.now()) / 60000));
  return Math.floor(mins / 60) + "h " + (mins % 60) + "m left";
}

function formatDate(time) {
  return new Date(time).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
}

function getStatus(book) {
  const hold = findHold(book.isbn);
  if (book.status === "checked-out" || (hold && hold.state === "borrowed")) {
    return { label: "Checked out", css: "checked-out", canReserve: false };
  }
  if (hold) return { label: "On hold for 24 hours", css: "on-hold", canReserve: false };
  return { label: "Available on shelf", css: "available", canReserve: true };
}


const clean = text => text.toLowerCase().replace(/-/g, "");

function matches(book) {
  if (selectedDept !== "All" && book.dept !== selectedDept) return false;

  const canReserve = getStatus(book).canReserve;
  if (statusFilter.value === "available" && !canReserve) return false;
  if (statusFilter.value === "unavailable" && canReserve) return false;

  const text = clean(searchInput.value.trim());
  const field = searchField.value;
  const fields = field === "all" ? ["title", "author", "subject", "isbn"] : [field];
  return fields.some(f => clean(book[f]).includes(text));
}


function showDeptButtons() {
  $("deptFilters").innerHTML = ["All", ...departments].map(name => {
    const count = name === "All" ? books.length : books.filter(b => b.dept === name).length;
    const active = name === selectedDept ? "active" : "";
    return `<button class="chip ${active}" data-dept="${name}">${name} (${count})</button>`;
  }).join("");
}

function showBooks() {
  const found = books.filter(matches);
  $("resultCount").textContent = plural(found.length, "book") + " found";

  if (found.length === 0) {
    $("bookGrid").innerHTML = `<div class="empty">No books match your search. Try a shorter word, another department, or clear the status filter.</div>`;
    return;
  }

  $("bookGrid").innerHTML = found.map(book => {
    const s = getStatus(book);
    return `
      <article class="book">
        <span class="badge ${s.css}">${s.label}</span>
        <h3>${book.title}</h3>
        <p class="author">${book.author}</p>
        <p class="meta"><strong>Subject:</strong> ${book.subject}</p>
        <p class="meta"><strong>Department:</strong> ${book.dept}</p>
        <p class="meta"><strong>ISBN:</strong> ${book.isbn}</p>
        <p class="meta"><strong>Shelf:</strong> ${book.shelf}</p>
        <button class="btn primary" data-isbn="${book.isbn}" ${s.canReserve ? "" : "disabled"}>
          ${s.canReserve ? "Reserve for 24 hours" : "Not available to reserve"}
        </button>
      </article>`;
  }).join("");
}

function showReservations() {
  $("holdCount").textContent = reservations.length;

  if (reservations.length === 0) {
    $("reservationList").innerHTML = `<li class="hint">You have no active holds. Find an available book and tap Reserve.</li>`;
    return;
  }

  $("reservationList").innerHTML = reservations.map(r => {
    const book = getBook(r.isbn);
    const info = `
      <span>${r.studentName} (ID ending ${r.studentId.slice(-3)})</span>
      <span>Borrowing for ${plural(r.days, "day")}</span>`;
    const button = (action, text, extra = "plain") =>
      `<button class="link-btn ${extra}" data-action="${action}" data-isbn="${r.isbn}">${text}</button>`;


    if (r.state !== "borrowed") {
      return `
        <li class="res-item">
          <strong>${book.title}</strong>
          <span>Shelf ${book.shelf}</span>
          ${info}
          <span>Collect within: ${timeLeft(r.expiresAt)}</span>
          <div class="res-actions">${button("collect", "Mark as collected")}${button("cancel", "Cancel hold", "")}</div>
        </li>`;
    }


    const late = daysLate(r);
    const due = late > 0
      ? `<span class="fine">Overdue by ${plural(late, "day")}. Fine: ₹${late * FINE_PER_DAY}</span>
         <span>The fine grows by ₹${FINE_PER_DAY} every day.</span>`
      : `<span>Return by: ${formatDate(r.dueAt)}</span>`;
    return `
      <li class="res-item ${late > 0 ? "overdue" : ""}">
        <strong>${book.title}</strong>
        ${info}
        ${due}
        <div class="res-actions">${button("return", "Return book")}${button("skip", "Demo: skip 1 day")}</div>
      </li>`;
  }).join("");
}

function refreshPage() {

  reservations = reservations.filter(r => r.state === "borrowed" || r.expiresAt > Date.now());
  save();
  showBooks();
  showReservations();
}


function openDialog(isbn) {
  selectedIsbn = isbn;
  const book = getBook(isbn);
  $("dialogBook").textContent = book.title + (book.author ? " by " + book.author : "");
  reserveForm.reset();
  $("borrowDays").value = 7;
  ["nameError", "idError", "daysError"].forEach(id => $(id).textContent = "");
  reserveForm.hidden = false;
  successBox.hidden = true;
  dialog.showModal();
  $("studentName").focus();
}

function confirmReservation(event) {
  event.preventDefault();
  const name = $("studentName").value.trim();
  const id = $("studentId").value.trim();
  const days = Number($("borrowDays").value);

  $("nameError").textContent = name.length < 3 ? "Enter your full name." : "";
  $("idError").textContent = /^\d{8}$/.test(id) ? "" : "Enter your 8-digit student ID (numbers only).";
  $("daysError").textContent = Number.isInteger(days) && days >= 1 && days <= MAX_DAYS
    ? "" : "Choose between 1 and " + MAX_DAYS + " days.";

  if ($("nameError").textContent || $("idError").textContent || $("daysError").textContent) return;

  if (reservations.filter(r => r.studentId === id).length >= MAX_HOLDS) {
    $("idError").textContent = "This ID already has " + MAX_HOLDS + " active holds. Cancel one to reserve another.";
    return;
  }

  const expiresAt = Date.now() + HOLD_HOURS * 60 * 60 * 1000;
  reservations.push({ isbn: selectedIsbn, studentName: name, studentId: id, days, expiresAt, state: "held" });
  save();

  const book = getBook(selectedIsbn);
  const until = new Date(expiresAt).toLocaleString([], {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
  });
  $("successText").textContent = `${name}, "${book.title}" is held for you on shelf ${book.shelf}. ` +
    `Collect it before ${until} and bring your student ID. ` +
    `You can keep it for ${plural(days, "day")} from pick-up.`;

  reserveForm.hidden = true;
  successBox.hidden = false;
  refreshPage();
}


searchInput.addEventListener("input", showBooks);
searchField.addEventListener("change", showBooks);
statusFilter.addEventListener("change", showBooks);

$("deptFilters").addEventListener("click", e => {
  const button = e.target.closest("button");
  if (!button) return;
  selectedDept = button.dataset.dept;
  showDeptButtons();
  showBooks();
});

$("bookGrid").addEventListener("click", e => {
  const button = e.target.closest("button");
  if (button && button.dataset.isbn !== undefined) openDialog(button.dataset.isbn);
});

$("reservationList").addEventListener("click", e => {
  const button = e.target.closest("button");
  if (!button) return;

  const action = button.dataset.action;
  const hold = findHold(button.dataset.isbn);
  if (!hold) return;
  $("notice").textContent = "";

  if (action === "cancel") {
    reservations = reservations.filter(r => r !== hold);
  } else if (action === "collect") {
    hold.state = "borrowed";
    hold.dueAt = Date.now() + hold.days * ONE_DAY;
  } else if (action === "return") {
    const fine = daysLate(hold) * FINE_PER_DAY;
    $("notice").textContent = fine > 0
      ? "Book returned late. Please pay a fine of ₹" + fine + " at the desk."
      : "Book returned on time. No fine. Thank you!";
    reservations = reservations.filter(r => r !== hold);
  } else if (action === "skip") {
    hold.dueAt -= ONE_DAY; 
  }

  save();
  refreshPage();
});

reserveForm.addEventListener("submit", confirmReservation);
$("cancelBtn").addEventListener("click", () => dialog.close());
$("doneBtn").addEventListener("click", () => dialog.close());


showDeptButtons();
refreshPage();
setInterval(refreshPage, 60000);
