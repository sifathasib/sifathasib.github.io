var myHeading = document.querySelector('h1');
var myButton = document.querySelector('button');
var myImg = document.querySelector('img');

if(!localStorage.getItem('name')){
    setUsername();
}
else{
    var storedName = localStorage.getItem(name);
    myHeading.textContent =  'Mozilla is cool '+storedName; 
}
myButton.onclick = function(){
    setUsername();
}
myImg.onclick = function(){
    var mySrc = myImg.getAttribute('src');
    if(mySrc === 'images/firefox-icon.png')
    {
       myImg.setAttribute('src','images/firefox2.png'); 
    }
    else{
        myImg.setAttribute('src','images/firefox-icon.png'); 
    }
}

function setUsername(){
    var myName = prompt('enter ur name: ');
    localStorage.setItem('name',myName);
    myHeading.textContent = 'Mozilla is cool '+myName;    
}
