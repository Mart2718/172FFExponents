
fetch('lesson.json').then(r=>r.json()).then(d=>{
const c=d.calculusBeforeCalculus;
document.querySelector('#cbc h2').textContent=c.title;
intro.textContent=c.intro;
idea.textContent=c.bigIdea;
cards.innerHTML=c.situations.map((s,i)=>`
<div class='card'>
<h3>${s.title}</h3>
<p>${s.summary}</p>
<button onclick="document.getElementById('s'+${i}).style.display='block';this.disabled=true;">Reveal Connection</button>
<div class='steps' id='s${i}'>${s.steps.map(x=>`<div>${x}</div>`).join('')}</div>
</div>`).join('');
if(window.MathJax){MathJax.typesetPromise();}
});
