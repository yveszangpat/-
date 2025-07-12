// อนาคตถ้าระบบช้าเปลี่ยนไปใช้ API ได้
const sheetID = "1QruJj-_Nx7IADSjPxTpTimW0EU78QJjEp9Qotxfo6rc";
const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json`;

const sheetName = "form1";
const url2 = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?sheet=${sheetName}`;

// ชื่อหัว column สถานะ
const STATUS_COL_NAME = "สถานะ";

fetch(url)
  .then((res) => res.text())
  .then((text) => {
    const json = JSON.parse(text.substring(47).slice(0, -2));
    const cols = json.table.cols.map((col) => col.label);
    const statusColIndex = cols.indexOf(STATUS_COL_NAME);
    let total = 0,
      pending = 0,
      inprogress = 0,
      done = 0;
    json.table.rows.forEach((row) => {
      // ถ้า cell ว่าง/null ให้ถือว่า "รอดำเนินการ"
      let status = row.c[statusColIndex]?.v;
      if (!status || status.trim() === "") {
        status = "รอดำเนินการ";
      }
      total++;
      if (status === "รอดำเนินการ") pending++;
      // else if (status === "กำลังดำเนินการ") inprogress++;
      else if (status === "เสร็จสิ้น") done++;
    });
    document.getElementById("totalTasks").textContent = total;
    document.getElementById("pendingTasks").textContent = pending;
    document.getElementById("doneTasks").textContent = done;
  });

function formatThaiDateTime(datetime) {
  if (!(datetime instanceof Date)) return { date: "-", time: "-" };

  const day = datetime.getDate();
  const month = datetime.getMonth() + 1; // JavaScript นับเดือนจาก 0
  const year = datetime.getFullYear();
  const hours = datetime.getHours().toString().padStart(2, "0");
  const minutes = datetime.getMinutes().toString().padStart(2, "0");

  const monthNames = [
    "",
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const formattedDate = `${day} ${monthNames[month]} ${year}`;
  const formattedTime = `${hours}:${minutes} น.`;

  return { date: formattedDate, time: formattedTime };
}

function parseGoogleDateString(dateStr) {
  const match = /Date\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/.exec(dateStr);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match.map(Number);
  return new Date(year, month, day, hour, minute, second);
}

fetch(url2)
  .then((res) => res.text())
  .then((rep) => {
    const data = JSON.parse(rep.substr(47).slice(0, -2));
    const rows = data.table.rows;
    const container = document.getElementById("card-container");

    if (!rows.length) {
      container.innerHTML = "<p>ไม่พบข้อมูล</p>";
      return;
    }

    rows.forEach((row, index) => {
      const [
        timestampRaw,
        building,
        floor,
        department,
        contact,
        issue,
        imgURL,
        status,

      ] = row.c.map((cell) => (cell ? cell.v : ""));

      const timestamp =
        typeof timestampRaw === "string" && timestampRaw.includes("Date(")
          ? parseGoogleDateString(timestampRaw)
          : new Date(timestampRaw);

      console.log("imgURL:", imgURL);


      const { date, time } = formatThaiDateTime(timestamp);

      function getImageURL(url) {
        if (!url) return "https://via.placeholder.com/300x200?text=ไม่มีรูป";

        // กรณีแบบ open?id=xxxx
        let match = url.match(/open\?id=([a-zA-Z0-9_-]+)/);
        if (match) {
          return `https://drive.google.com/thumbnail?id=${match[1]}`;
        }

        // กรณีแบบ /d/xxxx/
        match = url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
        if (match) {
          return `https://drive.google.com/thumbnail?id=${match[1]}`;
        }

        // ถ้าเป็น URL อื่นก็ใช้ตรงๆ
        return url;
      }


      const imageSrc = getImageURL(imgURL);

      console.log("raw imgURL:", imgURL);
      console.log("imageSrc:", imageSrc);

      const modalId = `modal${index}`;



// ส่งข้อมูลเมื่อกดยืนยัน
document.getElementById("confirmBtn").addEventListener("click", () => {
  const selectedStatus = document.querySelector('input[name="status"]:checked')?.value;


  if (selectedStatus === "done") {
    const detail = document.getElementById("detailDone").value.trim();
    const equipment = document.getElementById("equipmentDone").value.trim();
    const jobType = document.getElementById("jobTypeDone").value.trim();

    if (!detail) missingFields.push("รายละเอียดการซ่อม");
    if (!equipment) missingFields.push("อุปกรณ์ที่ใช้");
    if (!jobType) missingFields.push("ประเภทงาน");
  } else if (selectedStatus === "notdone") {
    const cannotFix = document.getElementById("cannotFix").value.trim();
    const jobType = document.getElementById("jobTypeNotDone").value.trim();

    if (!cannotFix) missingFields.push("ซ่อมไม่ได้");
    if (!jobType) missingFields.push("ประเภทงาน");
  }

  if (missingFields.length > 0) {
    showAlert(`กรุณากรอกข้อมูลให้ครบถ้วน: ${missingFields.join(", ")}`, "warning");
    return;
  }

  // เตรียมข้อมูลส่ง
  const data = { status: selectedStatus };

  if (selectedStatus === "done") {
    data.detail = document.getElementById("detailDone").value.trim();
    data.equipment = document.getElementById("equipmentDone").value.trim();
    data.jobType = document.getElementById("jobTypeDone").value.trim();
  } else if (selectedStatus === "notdone") {
    data.cannotFix = document.getElementById("cannotFix").value.trim();
    data.jobType = document.getElementById("jobTypeNotDone").value.trim();
  }

  // ส่งข้อมูลไปยัง Google Apps Script
  const scriptUrl = `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`; // แทนที่ YOUR_SCRIPT_ID ด้วย ID จริง

  fetch(scriptUrl, {
    method: "POST",
    mode: 'no-cors',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
    .then(() => {
      showAlert("✅ บันทึกข้อมูลเรียบร้อย", "success");
      resetForm();
      loadStats(); // โหลดสถิติใหม่
    })
    .catch(err => {
      console.error("Error:", err);
      showAlert("❌ ไม่สามารถเชื่อมต่อกับระบบได้", "error");
    });
});
