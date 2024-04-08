let url = 'https://corsproxy.io?https://content-static.mihoyo.com/content/ysCn/getContentList?pageSize=10000&pageNum=1&channelId=10';
fetch(url, {cache: "no-store"})
    .then(response => {
        alert('成功')
    });
function search() {
    let keyword = document.getElementById('keyword-input').value;
    let url = 'https://corsproxy.io?https://content-static.mihoyo.com/content/ysCn/getContentList?pageSize=10000&pageNum=1&channelId=10';
    fetch(url, {cache: "no-store"})
        .then(response => {
            alert('成功')
        });
}