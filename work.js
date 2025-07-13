// อนาคตถ้าระบบช้าเปลี่ยนไปใช้ API ได้
const sheetID = "1QruJj-_Nx7IADSjPxTpTimW0EU78QJjEp9Qotxfo6rc";
const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json`;

const sheetName = "form1";
const url2 = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?sheet=${sheetName}`;

// ชื่อหัว column สถานะ
const STATUS_COL_NAME = "สถานะ";

// ตัวแปรเก็บข้อมูลทั้งหมด
let allTasksData = [];
let currentFilter = 'all';

// ฟังก์ชันอัปเดตสถิติ
function updateStats() {
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
}

// ฟังก์ชันฟิลเตอร์ข้อมูล
function filterTasks(status) {
  currentFilter = status;
  const cards = document.querySelectorAll('#card-container .col-md-4');
  
  // อัปเดตสถานะปุ่ม
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`filter-${status}`).classList.add('active');
  
  cards.forEach(card => {
    const statusBadge = card.querySelector('.status-badge');
    const cardStatus = statusBadge ? statusBadge.textContent.trim() : 'รอดำเนินการ';
    
    if (status === 'all') {
      card.style.display = 'block';
    } else if (status === 'pending' && cardStatus === 'รอดำเนินการ') {
      card.style.display = 'block';
    } else if (status === 'done' && cardStatus === 'เสร็จสิ้น') {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
  
 
}

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

// ฟังก์ชันโหลดข้อมูลและสร้างการ์ด
function loadTasks() {
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

      // เก็บข้อมูลไว้ใน allTasksData
      allTasksData = rows;
      container.innerHTML = ''; // ล้างข้อมูลเก่า

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

        const displayStatus = status ? status : "รอดำเนินการ";

        const timestamp =
          typeof timestampRaw === "string" && timestampRaw.includes("Date(")
            ? parseGoogleDateString(timestampRaw)
            : new Date(timestampRaw);

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
        const modalId = `modal${index}`;

        const card = `
            <div class="col-md-4 mb-4">
                <div class="card">
                    <div class="image-wrapper">
                      <img src="${imageSrc}" class="card-img-top" alt="รูปภาพแจ้งซ่อม">
                      <span class="status-badge">${displayStatus}</span>
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
                                          <span class="status-badge">${displayStatus}</span>
                                        </div>
                                        <p>วันที่แจ้ง : ${date}</p>
                                        <p>เวลาที่แจ้ง : ${time}</p>
                                        <p>อาคาร : ${building}</p>
                                        <p>ชั้น : ${floor}</p>
                                        <p>หน่วยงาน : ${department}</p>
                                        <p>เบอร์ติดต่อ : ${contact}</p>
                                        <p>รายการแจ้งซ่อม : ${issue}</p>
                                        <hr>
                                    <div class="from">
                                        <div class="form">
                                            <form action="">
                                                ผลการซ่อม :
                                                <input type="radio" id="doneRadio${index}" name="status${index}" value="done"
                                                    onclick="showFormsuccess(${index})" />
                                                <label for="doneRadio${index}">ดำเนินการเสร็จเรียบร้อย</label>

                                                <input type="radio" id="notdoneRadio${index}" name="status${index}" value="notdone"
                                                    onclick="showFormunsuccess(${index})" />
                                                <label for="notdoneRadio${index}">ไม่สามารถดำเนินการได้</label>
                                            </form>

                                            <!-- ฟอร์มสำเร็จ -->
                                            <div id="formContainer${index}" style="display:none;">
                                                <label class="descriction" for="detail${index}">รายละเอียดการซ่อม/ความเห็นช่าง:</label><br>
                                                <textarea id="detail${index}" rows="2"
                                                    style="width: 100%; object-fit: cover;"></textarea>
                                                <label for="equipment${index}">อุปกรณ์ที่ใช้:</label><br>
                                                <textarea id="equipment${index}" rows="2"
                                                    style="width: 100%; object-fit: cover;"></textarea>
                                                <label for="worktype${index}">ประเภทงาน:</label><br>
                                                <textarea id="worktype${index}" rows="1" style="width: 100%; object-fit: cover;"></textarea>
                                                
                                            </div>
                                            <!-- ฟอร์มไม่สำเร็จ -->
                                            <div id="formContainernot${index}" style="display:none;">
                                                <label class="descriction"
                                                    for="detailnot${index}">รายละเอียดเพิ่มเติมกรณีที่ไม่สามารถดำเนินการได้:</label><br>
                                                <textarea id="detailnot${index}" rows="2"
                                                    style="width: 100%; object-fit: cover;"></textarea>
                                                <label for="worktypenot${index}">ประเภทงาน:</label><br>
                                                <textarea id="worktypenot${index}" rows="1" style="width: 100%; object-fit: cover;"></textarea>
                                                
                                            </div>
                                        </div>
                                    </div>
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

      // หลังจากโหลดข้อมูลเสร็จ ให้ใช้ฟิลเตอร์ปัจจุบัน
      if (currentFilter !== 'all') {
        filterTasks(currentFilter);
      }
    })
    .catch((err) => {
      console.error("เกิดข้อผิดพลาด:", err);
      document.getElementById("card-container").innerHTML =
        "<p>โหลดข้อมูลไม่สำเร็จ</p>";
    });
}

// แสดงฟอร์มดำเนินการเสร็จสิ้น
function showFormsuccess(index) {
    // ซ่อนฟอร์ม "ไม่สำเร็จ"
    document.getElementById(`formContainernot${index}`).style.display = 'none';
    // แสดงฟอร์ม "สำเร็จ"
    document.getElementById(`formContainer${index}`).style.display = 'block';
}

function showFormunsuccess(index) {
    // ซ่อนฟอร์ม "สำเร็จ"
    document.getElementById(`formContainer${index}`).style.display = 'none';
    // แสดงฟอร์ม "ไม่สำเร็จ"
    document.getElementById(`formContainernot${index}`).style.display = 'block';
}

// เรียกใช้ฟังก์ชันเมื่อเพจโหลด
document.addEventListener('DOMContentLoaded', function() {
  updateStats();
  loadTasks();
});