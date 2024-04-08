function search() {
    let keyword = document.getElementById('keyword-input').value;
    let url = 'https://content-static.mihoyo.com/content/ysCn/getContentList?pageSize=10000&pageNum=1&channelId=10';
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log(data)
        });
}