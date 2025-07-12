// อนาคตถ้าระบบช้าเปลี่ยนไปใช้ API ได้
const sheetID = "1QruJj-_Nx7IADSjPxTpTimW0EU78QJjEp9Qotxfo6rc";
const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json`;


// ชื่อหัว column สถานะ
const STATUS_COL_NAME = "สถานะ";

fetch(url)
  .then(res => res.text())
  .then(text => {
    const json = JSON.parse(text.substring(47).slice(0, -2));
    const cols = json.table.cols.map(col => col.label);
    const statusColIndex = cols.indexOf(STATUS_COL_NAME);
    let total = 0, pending = 0, inprogress = 0, done = 0;
    json.table.rows.forEach(row => {
      // ถ้า cell ว่าง/null ให้ถือว่า "รอดำเนินการ"
      let status = row.c[statusColIndex]?.v;
      if (!status || status.trim() === "") {
        status = "รอดำเนินการ";
      }
      total++;
      if(status === "รอดำเนินการ") pending++;
      else if(status === "กำลังดำเนินการ") inprogress++;
      else if(status === "เสร็จสิ้น") done++;
    });
    document.getElementById("totalTasks").textContent = total;
    document.getElementById("pendingTasks").textContent = pending;
    document.getElementById("inprogressTasks").textContent = inprogress;
    document.getElementById("doneTasks").textContent = done;
  });