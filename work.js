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
        let status = row.c[statusColIndex]?.v;
        if (!status || status.trim() === "") {
          status = "รอดำเนินการ";
        }
        total++;
        if (status === "รอดำเนินการ") pending++;
        else if (status === "เสร็จสิ้น") done++;
      });
      document.getElementById("totalTasks").textContent = total;
      document.getElementById("pendingTasks").textContent = pending;
      document.getElementById("doneTasks").textContent = done;
    });
}

// ฟังก์ชันฟิลเตอร์ข้อมูล
function filterTasks(status) {
  currentFilter = status;
  const cards = document.querySelectorAll('#card-container .col-md-4');

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`filter-${status}`).classList.add('active');

  cards.forEach(card => {
    const statusBadge = card.querySelector('.status-badge');
    const cardStatus = statusBadge ? statusBadge.textContent.trim() : 'รอดำเนินการ';

    if (cardStatus === 'เสร็จสิ้น') {
      statusBadge.style.backgroundColor = 'red';
      statusBadge.style.color = 'white';
    } else {
      statusBadge.style.backgroundColor = '#ddd';
      statusBadge.style.color = '#333';
    }

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
  const month = datetime.getMonth() + 1;
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

// ฟังก์ชันสร้าง PDF
function generatePDF(rowData, index) {
  const button = event.target;
  const originalText = button.innerHTML;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังสร้าง PDF...';
  button.disabled = true;

  // ดึงข้อมูลจาก rowData
  const [
    timestampRaw, building, floor, department, contact,
    issue, imgURL, status, detail, equipment, cannotFix, jobType, sequence
  ] = rowData.c.map((cell) => (cell ? cell.v : ""));

  const timestamp = typeof timestampRaw === "string" && timestampRaw.includes("Date(")
    ? parseGoogleDateString(timestampRaw)
    : new Date(timestampRaw);

  const { date, time } = formatThaiDateTime(timestamp);

  const data = {
    date: date,
    time: time.replace(' น.', ''),
    building: building || '-',
    floor: floor || '-',
    department: department || '-',
    contact: contact || '-',
    issue: issue || '-',
    detail: detail || '-',
    equipment: equipment || '-',
    cannotFix: cannotFix || '-',
    jobType: jobType || '-',
    sequence: sequence || index + 1
  };

  // ใช้ JSONP แทน fetch
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwJkJuQCiM-ofuh_KYkCC7Espw7vksWNKUhvma06w_ocPLjDkcA_7ZAsLum0aSRwK957Q/exec';

  sendDataWithJSONP(SCRIPT_URL, data)
    .then(result => {
      if (result.success) {
        alert(`✅ สร้าง PDF เรียบร้อย!\nเลขที่เอกสาร: ${result.documentNumber}`);

        // ดาวน์โหลดไฟล์
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = `ใบแจ้งซ่อม_${result.documentNumber}_${building}_${floor}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

      } else {
        alert('❌ เกิดข้อผิดพลาดในการสร้าง PDF: ' + result.error);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + error.message);
    })
    .finally(() => {
      button.innerHTML = originalText;
      button.disabled = false;
    });
}

// ฟังก์ชันสำหรับ JSONP
function sendDataWithJSONP(url, data) {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());

    // สร้าง callback function
    window[callbackName] = function (response) {
      delete window[callbackName];
      document.body.removeChild(script);
      resolve(response);
    };

    // สร้าง script element
    const script = document.createElement('script');
    const params = new URLSearchParams();
    params.append('callback', callbackName);
    params.append('data', JSON.stringify(data));

    script.src = url + '?' + params.toString();
    script.onerror = function () {
      delete window[callbackName];
      document.body.removeChild(script);
      reject(new Error('JSONP request failed'));
    };

    document.body.appendChild(script);

    // Timeout
    setTimeout(() => {
      if (window[callbackName]) {
        delete window[callbackName];
        document.body.removeChild(script);
        reject(new Error('JSONP request timeout'));
      }
    }, 30000);
  });
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

      allTasksData = rows;
      container.innerHTML = '';
      

      allTasksData = rows;

      rows.sort((a, b) => {
        const getDate = (val) => {
          const raw = val?.c?.[0]?.v;
          if (typeof raw === "string" && raw.includes("Date(")) {
            return parseGoogleDateString(raw);
          }
          return new Date(raw);
        };
        return getDate(b) - getDate(a);
      });

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
        const timestamp = typeof timestampRaw === "string" && timestampRaw.includes("Date(")
          ? parseGoogleDateString(timestampRaw)
          : new Date(timestampRaw);

        const { date, time } = formatThaiDateTime(timestamp);

        function getImageURL(url) {
          if (!url) return "https://via.placeholder.com/300x200?text=ไม่มีรูป";

          let match = url.match(/open\?id=([a-zA-Z0-9_-]+)/);
          if (match) {
            return `https://drive.google.com/thumbnail?id=${match[1]}`;
          }

          match = url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
          if (match) {
            return `https://drive.google.com/thumbnail?id=${match[1]}`;
          }

          return url;
        }

        const imageSrc = getImageURL(imgURL);
        const modalId = `modal${index}`;
        const rowIndex = index + 2;

        // กำหนดปุ่มตามสถานะ
        const buttonHTML = displayStatus === "เสร็จสิ้น"
          ? `<button type="button" class="btn btn-success" onclick="generatePDF(allTasksData[${index}], ${index})">
               <i class="fas fa-download"></i> โหลด PDF
             </button>`
          : `<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#${modalId}">
               รับงาน
             </button>`;

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

                        ${buttonHTML}

                        ${displayStatus !== "เสร็จสิ้น" ? `
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

                                            <div id="formContainer${index}" style="display:none;">
                                                <label class="descriction" for="detail${index}">รายละเอียดการซ่อม/ความเห็นช่าง:</label><br>
                                                <textarea id="detail${index}" rows="2" style="width: 100%; object-fit: cover;"></textarea>
                                                <label for="equipment${index}">อุปกรณ์ที่ใช้:</label><br>
                                                <textarea id="equipment${index}" rows="2" style="width: 100%; object-fit: cover;"></textarea>
                                                <label for="worktype${index}">ประเภทงาน:</label><br>
                                                <textarea id="worktype${index}" rows="1" style="width: 100%; object-fit: cover;"></textarea>
                                            </div>
                                            
                                            <div id="formContainernot${index}" style="display:none;">
                                                <label class="descriction" for="detailnot${index}">รายละเอียดเพิ่มเติมกรณีที่ไม่สามารถดำเนินการได้:</label><br>
                                                <textarea id="detailnot${index}" rows="2" style="width: 100%; object-fit: cover;"></textarea>
                                                <label for="worktypenot${index}">ประเภทงาน:</label><br>
                                                <textarea id="worktypenot${index}" rows="1" style="width: 100%; object-fit: cover;"></textarea>
                                            </div>
                                        </div>
                                    </div>
                                    </div>
                                    <div class="modal-footer">
                                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ปิด</button>
                                        <button class="btn btn-primary" onclick="submitForm(${index}, ${rowIndex})">ยืนยัน</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>`;
        container.innerHTML += card;
      });

      if (currentFilter !== 'all') {
        filterTasks(currentFilter);
      }
    })
    .catch((err) => {
      console.error("เกิดข้อผิดพลาด:", err);
      document.getElementById("card-container").innerHTML = "<p>โหลดข้อมูลไม่สำเร็จ</p>";
    });
}


function showFormsuccess(index) {
  document.getElementById(`formContainernot${index}`).style.display = 'none';
  document.getElementById(`formContainer${index}`).style.display = 'block';
}

function showFormunsuccess(index) {
  document.getElementById(`formContainer${index}`).style.display = 'none';
  document.getElementById(`formContainernot${index}`).style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function () {
  updateStats();
  loadTasks();
});

function submitForm(index, rowIndex) {
  const selectedStatus = document.querySelector(`input[name="status${index}"]:checked`)?.value;

  if (!selectedStatus) {
    alert("กรุณาเลือกผลการซ่อม");
    return;
  }

  const data = {
    status: selectedStatus,
    rowIndex: rowIndex
  };

  if (selectedStatus === "done") {
    data.detail = document.getElementById(`detail${index}`)?.value.trim() || "-";
    data.equipment = document.getElementById(`equipment${index}`)?.value.trim() || "-";
    data.jobType = document.getElementById(`worktype${index}`)?.value.trim() || "-";
  } else if (selectedStatus === "notdone") {
    data.detail = "-";
    data.equipment = "-";
    data.cannotFix = document.getElementById(`detailnot${index}`)?.value.trim() || "-";
    data.jobType = document.getElementById(`worktypenot${index}`)?.value.trim() || "-";
  }
  console.log("Sending data:", data);

  fetch("https://script.google.com/macros/s/AKfycbwtAQuDSVDBIpm3ZaK7Dg-zGoSl0jOpbS_8fdK_11Rd4uzqNX0XGZvye2gesZsNewaoBw/exec", {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(() => {
      alert("✅ บันทึกข้อมูลเรียบร้อย");
      const modal = bootstrap.Modal.getInstance(document.getElementById(`modal${index}`));
      if (modal) modal.hide();
      location.reload();
    })
    .catch(err => {
      console.error("Error:", err);
      alert("❌ ไม่สามารถเชื่อมต่อกับระบบได้");
    });
}


let chartInstance;

function toggleChart() {
  const chartDiv = document.getElementById("chartContainer");

  if (chartDiv.style.display === "none") {
    chartDiv.style.display = "block";

    fetch(url2)
      .then(res => res.text())
      .then(rep => {
        const data = JSON.parse(rep.substr(47).slice(0, -2));
        const rows = data.table.rows;

        // หาคอลัมน์ชื่อ "ประเภทงาน"
        const colIndex = data.table.cols.findIndex(col => col.label === "ประเภทงาน");
        if (colIndex === -1) {
          alert("ไม่พบคอลัมน์ประเภทงาน");
          return;
        }

        // นับจำนวนประเภทงาน
        const typeCounts = {};
        rows.forEach(row => {
          const value = row.c[colIndex]?.v?.trim();
          if (value) {
            typeCounts[value] = (typeCounts[value] || 0) + 1;
          }
        });

        // สร้างกราฟ
        const labels = Object.keys(typeCounts);
        const counts = Object.values(typeCounts);

        const ctx = document.getElementById("workTypeChart").getContext("2d");

        if (chartInstance) chartInstance.destroy(); // ลบกราฟเก่าหากมี
        chartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'ประเภทงาน',
              data: counts,
              backgroundColor: [
                '#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8',
                '#6f42c1', '#fd7e14', '#20c997', '#6c757d', '#343a40'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: 'สถิติตามประเภทงาน' }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1,
                  precision: 0 // บังคับให้เป็นเลขจำนวนเต็ม
                }
              }
            }
          }
        });
      })
      .catch(err => {
        console.error("โหลดข้อมูลประเภทงานล้มเหลว:", err);
        alert("เกิดข้อผิดพลาดในการโหลดประเภทงาน");
      });

  } else {
    chartDiv.style.display = "none";
  }
}