// 生成月份按钮
const months = ['一月', '二月', '三月', '四月', '五月', '六月', 
                '七月', '八月', '九月', '十月', '十一月', '十二月'];
const monthButtons = document.getElementById('monthButtons');

// 初始化日记内容数据（年份、月份、日期、内容）
// 获取当前年份
const currentYear = new Date().getFullYear();
const journalData = [
    { year: currentYear, month: 2, day: 9, content: "重新安装了服务器，部署了网页以及mysql，打算等明天硬盘到了装一个windows系统，然后将机械硬盘作为两个系统的存储硬盘" },

    // 可以继续添加更多日期的内容
];

months.forEach((month, index) => {
    const button = document.createElement('button');
    button.className = 'month-btn';
    button.textContent = month;
    button.dataset.month = index + 1;
    button.addEventListener('click', showCalendar);
    monthButtons.appendChild(button);
});

// 生成日份按钮
function showCalendar(event) {
    const month = parseInt(event.target.dataset.month);
    const daysInMonth = new Date(new Date().getFullYear(), month, 0).getDate();
    
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';

    const calendarJournal = document.getElementById('calendarJournal');
    calendarJournal.innerHTML = ''; // 清空日记内容

    for (let day = 1; day <= daysInMonth; day++) {
        const dayBtn = document.createElement('button');
        dayBtn.className = 'day-btn';
        dayBtn.textContent = day;
        dayBtn.dataset.day = day;
        dayBtn.dataset.month = month;
        dayBtn.addEventListener('click', showJournal);
        calendarDays.appendChild(dayBtn);
    }
}

// 显示日记内容
function showJournal(event) {
    const day = parseInt(event.target.dataset.day);
    const month = parseInt(event.target.dataset.month);
    const year = new Date().getFullYear();
    const journalContainer = document.getElementById('calendarJournal');
    
    // 根据日期查找对应的日记内容
    const journalEntry = journalData.find(entry => 
        entry.year === year && entry.month === month && entry.day === day
    );

    // 如果没有找到对应的日记内容，显示默认内容
    const content = journalEntry ? journalEntry.content : "暂无日记内容...";

    journalContainer.innerHTML = `
        <div class="journal">
            <h3>${year}年${month}月${day}日 的日记</h3>
            <p>${content}</p>
        </div>
    `;
}

// 初始加载一月日历
document.querySelector('.month-btn').click();
