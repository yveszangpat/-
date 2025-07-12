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
      else if (status === "กำลังดำเนินการ") inprogress++;
      else if (status === "เสร็จสิ้น") done++;
    });
    document.getElementById("totalTasks").textContent = total;
    document.getElementById("pendingTasks").textContent = pending;
    document.getElementById("inprogressTasks").textContent = inprogress;
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
      
    
      const card = `
            <div class="col-md-4 mb-4">
                <div class="card">
                    <div class="image-wrapper">
                      <img src="${imageSrc}" class="card-img-top" alt="รูปภาพแจ้งซ่อม">
                      <span class="status-badge">${status}</span>
                    </div>
                    <div class="card-body">
                        <p>วันที่แจ้ง : ${date}</p>
                        <p>เวลาที่แจ้ง : ${time}</p>
                        <p class="card-title">อาคาร : ${building}</p>
                        <p>ชั้น : ${floor}</p>
                        <p>หน่วยงานผู้แจ้ง : ${department}</p>
                        <p>เบอร์ภายในที่ติดต่อ : ${contact}</p>
                        <p class="mb-2">รายการแจ้งซ่อม : ${issue}</p>

                        <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#${modalId}">
                            รับงาน
                        </button>

                        <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="${modalId}Label">รายละเอียดแจ้งซ่อม</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                    </div>
                                    <div class="modal-body">
                                       <div class="image-wrapper">
                                          <img src="${imageSrc}" class="card-img-top" alt="รูปภาพแจ้งซ่อม">
                                          <span class="status-badge">${status}</span>
                                        </div>
                                        <p>วันที่แจ้ง : ${date}</p>
                                        <p>เวลาที่แจ้ง : ${time}</p>
                                        <p>อาคาร : ${building}</p>
                                        <p>ชั้น : ${floor}</p>
                                        <p>หน่วยงาน : ${department}</p>
                                        <p>เบอร์ติดต่อ : ${contact}</p>
                                        <p>รายการแจ้งซ่อม : ${issue}</p>
                                    </div>
                                    <div class="modal-footer">
                                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ปิด</button>
                                        <button type="button" class="btn btn-primary">ยืนยัน</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
      container.innerHTML += card;
    });
  })
  .catch((err) => {
    console.error("เกิดข้อผิดพลาด:", err);
    document.getElementById("card-container").innerHTML =
      "<p>โหลดข้อมูลไม่สำเร็จ</p>";
  });


//แสดงฟอร์มดำเนินการเสร็จสิ้น
function showFormsuccess() {
  const doneRadio = document.getElementById('doneRadio');
  const form = document.getElementById('formContainer');
  const formnot = document.getElementById('formContainernot');

  if (doneRadio.checked) {
    form.style.display = 'block';
    formnot.style.display = 'none';
  } else {
    form.style.display = 'none';
  }
}

//แสดงฟอร์มดำเนินการไม่สำเร็จ
function showFormunsuccess() {
  const notdoneRadio = document.getElementById('notdoneRadio');
  const form = document.getElementById('formContainer');
  const formnot = document.getElementById('formContainernot');

  if (notdoneRadio.checked) {
    formnot.style.display = 'block';
    form.style.display = 'none';
  } else {
    formnot.style.display = 'none';
  }
}

