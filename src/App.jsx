import { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";

function App() {

const [activities,setActivities]=useState([]);
const [history,setHistory]=useState([]);
const [newActivity,setNewActivity]=useState("");
const [selectedActivity,setSelectedActivity]=useState(null);
const [seconds,setSeconds]=useState(0);
const [comment,setComment]=useState("");
const [isRunning,setIsRunning]=useState(false);

const intervalRef=useRef(null);

const defaultActivities=[
"Comité Interno",
"Daily",
"Triage",
"Soporte consultoría",
"Soporte Chat"
];

useEffect(()=>{

const stored=localStorage.getItem("workApp");

if(stored){
const data=JSON.parse(stored);
setActivities(data.activities||[]);
setHistory(data.history||[]);
}

},[]);

useEffect(()=>{

localStorage.setItem(
"workApp",
JSON.stringify({activities,history})
);

},[activities,history]);

useEffect(()=>{

if(isRunning){

intervalRef.current=setInterval(()=>{
setSeconds(prev=>prev+1);
},1000);

}else{

clearInterval(intervalRef.current);

}

return()=>clearInterval(intervalRef.current);

},[isRunning]);

const addActivity=(name)=>{

if(!name)return;

const exists=activities.find(a=>a.name===name);

if(exists)return;

const newItem={
id:Date.now(),
name,
records:[]
};

setActivities([...activities,newItem]);

};

const startSession=(activity)=>{

setSelectedActivity(activity);
setSeconds(0);
setComment("");
setIsRunning(true);

};

const finishSession=()=>{

setIsRunning(false);

const updated=activities.map(a=>
a.id===selectedActivity.id
?{
...a,
records:[
...a.records,
{
duration:seconds,
comment,
date:new Date().toLocaleString()
}
]
}
:a
);

setActivities(updated);
setSelectedActivity(null);
setSeconds(0);
setComment("");

};

const saveDay=()=>{

if(activities.length===0)return;

const newDay={
date:new Date().toLocaleDateString(),
activities
};

setHistory([...history,newDay]);
setActivities([]);

};

const formatTime=(total)=>{

const h=Math.floor(total/3600);
const m=Math.floor((total%3600)/60);
const s=total%60;

return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;

};

const totalActivityTime=(records)=>records.reduce((acc,r)=>acc+r.duration,0);

const totalDayTime=(day)=>{

let total=0;

day.activities.forEach(a=>{
a.records.forEach(r=>{
total+=r.duration;
});
});

return total;

};

const todayTotal=()=>{

let total=0;

activities.forEach(a=>{
a.records.forEach(r=>{
total+=r.duration;
});
});

return total;

};

const exportCSV=async()=>{

let csv="Fecha,Actividad,Tiempo,Comentario\n";

history.forEach(day=>{
day.activities.forEach(a=>{
a.records.forEach(r=>{
csv+=`${day.date},${a.name},${formatTime(r.duration)},${r.comment}\n`;
});
});
});

await Filesystem.writeFile({
path:`registro_${Date.now()}.csv`,
data:csv,
directory:Directory.Documents,
encoding:Encoding.UTF8
});

alert("CSV guardado en Documentos");

};

const exportPDF=async()=>{

const doc=new jsPDF();

let y=10;

doc.text("Registro de Actividades",10,y);

y+=10;

history.forEach(day=>{

doc.text(`Fecha: ${day.date}`,10,y);

y+=6;

day.activities.forEach(a=>{
a.records.forEach(r=>{
doc.text(`${a.name} - ${formatTime(r.duration)} - ${r.comment}`,10,y);
y+=6;
});
});

y+=4;

});

const pdf=doc.output("datauristring");

await Filesystem.writeFile({
path:`registro_${Date.now()}.pdf`,
data:pdf.split(",")[1],
directory:Directory.Documents
});

alert("PDF guardado en Documentos");

};

return(

<>

<style>{`

body{
margin:0;
font-family:Segoe UI;
background:linear-gradient(180deg,#1e40af,#3b82f6);
}

.container{
max-width:500px;
margin:auto;
padding:80px 20px 40px;
}

.header{
color:white;
margin-bottom:25px;
}

.header h1{
margin:0;
font-size:28px;
}

.card{
background:white;
padding:20px;
border-radius:16px;
margin-bottom:18px;
box-shadow:0 10px 25px rgba(0,0,0,.1);
}

.quick-buttons{
display:flex;
flex-wrap:wrap;
gap:8px;
margin-top:10px;
}

.quick-buttons button{
background:#6ee7b7;
border:none;
padding:8px 12px;
border-radius:8px;
cursor:pointer;
}

input,textarea{
width:100%;
padding:10px;
border-radius:10px;
border:1px solid #ddd;
margin-top:10px;
}

button.primary{
background:#1e40af;
color:white;
border:none;
padding:10px 15px;
border-radius:10px;
margin-top:10px;
cursor:pointer;
}

button.orange{
background:#f97316;
color:white;
border:none;
padding:10px 15px;
border-radius:10px;
cursor:pointer;
margin-top:10px;
}

.activity{
display:flex;
justify-content:space-between;
align-items:center;
margin-top:10px;
}

.timer{
font-size:40px;
text-align:center;
margin:20px 0;
color:#1e40af;
}

.history-day{
margin-top:15px;
border-top:1px solid #eee;
padding-top:10px;
}

.dashboard{
background:#ecfeff;
padding:12px;
border-radius:10px;
margin-bottom:15px;
}

`}</style>

<div className="container">

<div className="header">
<h1>Work Tracker</h1>
<p>Registro simple de actividades laborales</p>
</div>

<div className="card dashboard">
<strong>Tiempo trabajado hoy</strong>
<div>{formatTime(todayTotal())}</div>
</div>

{!selectedActivity &&(

<>

<div className="card">

<h3>Actividades rápidas</h3>

<div className="quick-buttons">

{defaultActivities.map(a=>(

<button key={a} onClick={()=>addActivity(a)}>
{a}
</button>

))}

</div>

<input
placeholder="Agregar actividad manual"
value={newActivity}
onChange={(e)=>setNewActivity(e.target.value)}
/>

<button
className="primary"
onClick={()=>{
addActivity(newActivity);
setNewActivity("");
}}
>

Agregar

</button>

</div>

<div className="card">

<h3>Actividades actuales</h3>

{activities.map(a=>(

<div className="activity" key={a.id}>

<div>
<strong>{a.name}</strong>
<div>
Tiempo total: {formatTime(totalActivityTime(a.records))}
</div>
</div>

<button
className="primary"
onClick={()=>startSession(a)}
>

Iniciar

</button>

</div>

))}

</div>

<div className="card">

<button className="orange" onClick={saveDay}>
Guardar jornada
</button>

</div>

<div className="card">

<h3>Historial</h3>

<button className="primary" onClick={exportCSV}>
Exportar CSV
</button>

<button className="orange" onClick={exportPDF}>
Exportar PDF
</button>

{history.map((day,i)=>(

<div className="history-day" key={i}>

<strong>{day.date}</strong>

<div>Total: {formatTime(totalDayTime(day))}</div>

{day.activities.map(a=>
a.records.map((r,idx)=>(

<div key={idx}>

{a.name} — {formatTime(r.duration)}

<br/>

<small>{r.comment}</small>

</div>

))
)}

</div>

))}

</div>

</>

)}

{selectedActivity&&(

<div className="card">

<h3>{selectedActivity.name}</h3>

<div className="timer">
{formatTime(seconds)}
</div>

{isRunning?(
<button
className="primary"
onClick={()=>setIsRunning(false)}
>
Pausar
</button>
):(
<button
className="primary"
onClick={()=>setIsRunning(true)}
>
Continuar
</button>
)}

<textarea
placeholder="Comentario sobre esta actividad"
value={comment}
onChange={(e)=>setComment(e.target.value)}
/>

<button
className="orange"
onClick={finishSession}
>

Finalizar sesión

</button>

</div>

)}

</div>

</>

);

}

export default App;