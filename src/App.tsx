import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Lenis from "lenis";
import {
  LayoutDashboard, MessageCircle, ListTodo, CalendarDays, FolderOpen, UserRound,
  Users, Plus, Sun, Moon, Menu, X, Search, Bell, MoreHorizontal, ArrowUpRight,
  Check, Clock3, AlertCircle, Paperclip, Send, ChevronDown, Trash2, CircleHelp,
  Settings, Sparkles, PanelLeftClose, PanelLeftOpen, Command, CheckCircle2
} from "lucide-react";

type Page = "Overview" | "Chat" | "Tasks" | "Meeting" | "Files" | "My space" | "Team";
type TaskStatus = "In progress" | "Blocked" | "Overdue" | "Awaiting review" | "Done";
type Task = { id: number; title: string; assignee: string; status: TaskStatus; due: string; };
type Message = { id: number; author: string; text: string; time: string };

const initialTasks: Task[] = [
  { id: 1, title: "Research similar campus apps", assignee: "Rahul", status: "Overdue", due: "Nov 20" },
  { id: 2, title: "Build login and timetable screens", assignee: "Kunal", status: "Blocked", due: "Nov 22" },
  { id: 3, title: "Design final poster", assignee: "Nisha", status: "In progress", due: "Nov 25" },
  { id: 4, title: "Prepare demo slides", assignee: "Priya", status: "Awaiting review", due: "Nov 28" },
];
const people = [
  { name: "Aditya", role: "Project coordinator", task: "No tasks yet", color: "blue" },
  { name: "Nisha", role: "UI/UX designer", task: "Design final poster", color: "pink" },
  { name: "Rahul", role: "Research lead", task: "Research similar campus apps", color: "green" },
  { name: "Priya", role: "Presentation", task: "Design final poster", color: "gold" },
  { name: "Kunal", role: "Developer", task: "Build login and timetable screens", color: "blue" },
];
const navItems: { name: Page; icon: typeof LayoutDashboard }[] = [
  { name: "Overview", icon: LayoutDashboard }, { name: "Chat", icon: MessageCircle },
  { name: "Tasks", icon: ListTodo }, { name: "Meeting", icon: CalendarDays },
  { name: "Files", icon: FolderOpen }, { name: "My space", icon: UserRound },
  { name: "Team", icon: Users },
];
const read = <T,>(key: string, fallback: T): T => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; }
  catch { return fallback; }
};

function SmoothInput({ value, onChange, placeholder, className = "" }: {
  value: string; onChange: (v: string) => void; placeholder: string; className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 520, damping: 34, mass: .45 });
  const [focused, setFocused] = useState(false);
  const [caretVisible, setCaretVisible] = useState(true);
  const sync = () => {
    const el = inputRef.current, measure = measureRef.current;
    if (!el || !measure) return;
    const style = getComputedStyle(el);
    measure.style.font = style.font;
    measure.style.letterSpacing = style.letterSpacing;
    measure.textContent = value.slice(0, el.selectionStart ?? value.length) || "";
    const pos = measure.getBoundingClientRect().width + parseFloat(style.paddingLeft || "0") - el.scrollLeft;
    x.set(Math.max(8, Math.min(pos, el.clientWidth - 8)));
    setCaretVisible((el.selectionStart ?? 0) === (el.selectionEnd ?? 0));
  };
  useEffect(() => { if (focused) requestAnimationFrame(sync); }, [value, focused]);
  return <div className={`smooth-input ${className}`}>
    <input ref={inputRef} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
      onFocus={() => { setFocused(true); requestAnimationFrame(sync); }} onBlur={() => setFocused(false)}
      onClick={sync} onKeyUp={sync} onSelect={sync} />
    <span ref={measureRef} className="measure-text" aria-hidden />
    {focused && caretVisible && <motion.i className="animated-caret" style={{ x: springX }} />}
  </div>;
}

function RollText({ children }: { children: string }) {
  return <span className="roll-text" aria-label={children}>{children.split("").map((char, i) =>
    <span key={i} style={{ transitionDelay: `${i * 18}ms` }}>{char === " " ? "\u00a0" : char}</span>)}</span>;
}
function Status({ status }: { status: TaskStatus }) {
  return <span className={`status status-${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>;
}
function WaveGrid() { return <div className="wave-grid" aria-hidden><div className="wave-glow" /></div>; }

function App() {
  const [page, setPage] = useState<Page>("Overview");
  const [collapsed, setCollapsed] = useState(true);
  const [dark, setDark] = useState(() => read("tf-theme", false));
  const [tasks, setTasks] = useState<Task[]>(() => read("tf-tasks", initialTasks));
  const [messages, setMessages] = useState<Message[]>(() => read("tf-messages", [
    { id: 1, author: "Nisha", text: "I’ve uploaded the latest poster draft.", time: "9:42 AM" },
    { id: 2, author: "Rahul", text: "I’ll share the campus app research today.", time: "9:46 AM" },
    { id: 3, author: "Aditya", text: "Can we confirm the timetable flow for the demo?", time: "10:02 AM" },
  ]));
  const [query, setQuery] = useState("");
  const [newTask, setNewTask] = useState("");
  const [assignee, setAssignee] = useState("Aditya");
  const [chatText, setChatText] = useState("");
  const [filter, setFilter] = useState("All");
  const [notes, setNotes] = useState(() => read("tf-notes", ""));
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => { localStorage.setItem("tf-theme", JSON.stringify(dark)); }, [dark]);
  useEffect(() => { localStorage.setItem("tf-tasks", JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem("tf-messages", JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem("tf-notes", JSON.stringify(notes)); }, [notes]);
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    let frame = 0;
    const raf = (time: number) => { lenis.raf(time); frame = requestAnimationFrame(raf); };
    frame = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(frame); lenis.destroy(); };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(t);
  }, [toast]);

  const accepted = tasks.filter(t => t.status === "Done").length;
  const counts = useMemo(() => ({
    progress: tasks.filter(t => t.status === "In progress").length,
    blocked: tasks.filter(t => t.status === "Blocked").length,
    overdue: tasks.filter(t => t.status === "Overdue").length,
    review: tasks.filter(t => t.status === "Awaiting review").length,
  }), [tasks]);
  const filteredTasks = tasks.filter(t => (filter === "All" || t.status === filter) &&
    (t.title.toLowerCase().includes(query.toLowerCase()) || t.assignee.toLowerCase().includes(query.toLowerCase())));
  const go = (p: Page) => { setPage(p); setMobileNav(false); };
  const addTask = () => {
    if (!newTask.trim()) { setToast("Please enter a task title"); return; }
    setTasks(prev => [{ id: Date.now(), title: newTask.trim(), assignee, status: "In progress", due: "Not set" }, ...prev]);
    setNewTask(""); setShowTaskForm(false); setToast("Task added successfully");
  };
  const sendMessage = () => {
    if (!chatText.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), author: "You", text: chatText.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setChatText("");
  };
  const updateStatus = (id: number, status: TaskStatus) => setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  const deleteTask = (id: number) => { setTasks(prev => prev.filter(t => t.id !== id)); setToast("Task deleted"); };

  const title = page === "Overview" ? "Capstone: Smart Campus App" : page;
  const subtitle = page === "Overview" ? "Build a working prototype and present it to the faculty panel" :
    ({ Chat: "Keep conversations and decisions in one place", Tasks: "Create, assign, and track work across the team",
      Meeting: "Plan reviews and keep milestones visible", Files: "Project documents and shared resources",
      "My space": "Your assigned work and personal progress", Team: "People, responsibilities, and collaboration" } as Record<string,string>)[page];

  return <div className={`app-shell ${dark ? "dark" : ""}`}>
    <WaveGrid />
    <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileNav ? "mobile-open" : ""}`}>
      <div className="brand"><span className="brand-mark" /><span className="brand-name">TeamFlow</span>
        <button className="icon-btn sidebar-close" onClick={() => setCollapsed(true)} aria-label="Close menu"><X size={17}/></button>
      </div>
      <nav>{navItems.map(({name, icon: Icon}) => <button key={name} onClick={() => { go(name); setCollapsed(true); }}
        className={`nav-item ${page === name ? "active" : ""}`} title={collapsed ? name : undefined}>
        <Icon size={18}/><span className="nav-label">{name}</span>
        {name === "Tasks" && tasks.length > 0 && <b className="nav-count">{tasks.length}</b>}
        {name === "Team" && <b className="nav-count">{people.length}</b>}
      </button>)}</nav>
      <div className="sidebar-bottom">
        <button className="theme-switch" onClick={() => setDark(v => !v)}>
          {dark ? <Sun size={17}/> : <Moon size={17}/>}<span className="nav-label">{dark ? "Light mode" : "Dark mode"}</span>
        </button>
        <button className="nav-item quiet" onClick={() => setToast("Settings are saved in this browser")}><Settings size={17}/><span className="nav-label">Settings</span></button>
      </div>
    </aside>

    <main className={`main-area ${collapsed ? "sidebar-collapsed" : ""}`}>
      <header className="topbar">
        <button className="icon-btn mobile-menu" onClick={() => setCollapsed(v => !v)} aria-label="Toggle sidebar"><Menu/></button>
        <button className="icon-btn collapse-btn" onClick={() => setCollapsed(v => !v)} title="Toggle sidebar">
          {collapsed ? <PanelLeftOpen size={18}/> : <PanelLeftClose size={18}/>}
        </button>
        <div className="breadcrumbs">Workspace <span>/</span> <b>{page}</b></div>
        <div className="top-actions">
          <button className="icon-btn" onClick={() => setToast("You’re all caught up")} aria-label="Notifications"><Bell size={18}/><i className="notification-dot"/></button>
          <button className="avatar avatar-you" onClick={() => go("My space")} title="My space">Y</button>
        </div>
      </header>

      <section className="page-heading">
        <div><p className="eyebrow"><Sparkles size={13}/> TEAM WORKSPACE</p><h1><RollText>{title}</RollText></h1><p className="subtitle">{subtitle}</p></div>
        <button className="primary-btn" onClick={() => { setPage("Tasks"); setShowTaskForm(true); }}><Plus size={17}/> New task</button>
      </section>

      <AnimatePresence mode="wait">
        <motion.div key={page} className="page-content" initial={{opacity:0,y:12,filter:"blur(4px)"}} animate={{opacity:1,y:0,filter:"blur(0px)"}} exit={{opacity:0,y:-8}} transition={{duration:.28}}>
          {page === "Overview" && <Overview tasks={tasks} counts={counts} accepted={accepted} go={go} updateStatus={updateStatus}/>}
          {page === "Chat" && <Chat messages={messages} value={chatText} setValue={setChatText} send={sendMessage}/>}
          {page === "Tasks" && <TasksPage tasks={filteredTasks} allCount={tasks.length} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} showForm={showTaskForm} setShowForm={setShowTaskForm} newTask={newTask} setNewTask={setNewTask} assignee={assignee} setAssignee={setAssignee} addTask={addTask} updateStatus={updateStatus} deleteTask={deleteTask}/>}
          {page === "Meeting" && <Meeting go={go}/>}
          {page === "Files" && <FilesPage/>}
          {page === "My space" && <MySpace tasks={tasks} notes={notes} setNotes={setNotes} go={go}/>}
          {page === "Team" && <Team go={go} tasks={tasks}/>}
        </motion.div>
      </AnimatePresence>
      <GlassDock page={page} go={go}/>
      <footer>TeamFlow <span>•</span> Smart Campus App <span>•</span> Your team, in sync.</footer>
    </main>
    <AnimatePresence>{toast && <motion.div className="toast" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}}><CheckCircle2 size={17}/>{toast}</motion.div>}</AnimatePresence>
  </div>;
}

function Panel({title,children,className=""}:{title:string;children:React.ReactNode;className?:string}) {
  return <section className={`panel ${className}`}><div className="panel-title">{title}</div>{children}</section>;
}
function Overview({tasks,counts,accepted,go,updateStatus}:{tasks:Task[];counts:{progress:number;blocked:number;overdue:number;review:number};accepted:number;go:(p:Page)=>void;updateStatus:(id:number,s:TaskStatus)=>void}) {
  const total = tasks.length || 1;
  const pct = Math.round(accepted/total*100);
  const attention = tasks.filter(t => ["Overdue","Blocked","Awaiting review"].includes(t.status)).slice(0,4);
  return <>
    <Panel title="Project progress" className="progress-panel">
      <div className="progress-meta"><span>{accepted} of {tasks.length} tasks accepted. Submitted work is not counted until a reviewer accepts it.</span><b>21 days to deadline <span>(2026-12-09)</span></b></div>
      <div className="progress-track"><motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:.8}}/></div>
    </Panel>
    <div className="stats-grid">
      {[["In progress",counts.progress,"blue"],["Blocked",counts.blocked,"red"],["Overdue",counts.overdue,"gold"],["Awaiting review",counts.review,"lavender"]].map(([label,n,color])=>
        <motion.button whileHover={{y:-3}} className="stat-card" key={label as string} onClick={() => {go("Tasks");}}>
          <strong className={`stat-${color}`}>{n}</strong><span>{label}</span><ArrowUpRight size={15} className="stat-arrow"/>
        </motion.button>)}
    </div>
    <div className="overview-grid">
      <Panel title="Needs attention" className="attention-panel">
        {attention.length ? attention.map(t=><div className="attention-row" key={t.id}>
          <span>{t.title}</span><Status status={t.status}/>
        </div>) : <p className="muted">Nothing needs attention right now.</p>}
        <div className="section-subtitle">Who is doing what</div>
        {people.map(p=><div className="person-row" key={p.name}><span className={`person-avatar ${p.color}`}>{p.name[0]}</span><b>{p.name}</b><span>{tasks.filter(t=>t.assignee===p.name).map(t=>t.title).join("; ") || "No tasks yet"}</span></div>)}
      </Panel>
      <div className="right-stack">
        <Panel title="Recent decisions"><div className="decision-text">Demo will focus on timetable and alerts</div><span className="muted small">Last meeting · Nov 17</span></Panel>
        <Panel title="Milestones"><div className="milestone"><span>Mock demo</span><b>2026-11-28</b></div><div className="milestone"><span>Final presentation</span><b>2026-12-09</b></div></Panel>
      </div>
    </div>
    <StickyProjects/>
  </>;
}
function TasksPage(props:any) {
  const {tasks,allCount,query,setQuery,filter,setFilter,showForm,setShowForm,newTask,setNewTask,assignee,setAssignee,addTask,updateStatus,deleteTask}=props;
  const statuses:TaskStatus[]=["In progress","Blocked","Overdue","Awaiting review","Done"];
  return <>
    <div className="task-toolbar"><div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search tasks or assignees..."/></div>
      <select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option>{statuses.map(s=><option key={s}>{s}</option>)}</select>
      <button className="secondary-btn" onClick={()=>setShowForm(v=>!v)}><Plus size={16}/> Add task</button></div>
    <AnimatePresence>{showForm && <motion.div className="panel task-form" initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}>
      <div className="form-heading">Create a task <button className="icon-btn" onClick={()=>setShowForm(false)}><X size={16}/></button></div>
      <div className="form-grid"><SmoothInput value={newTask} onChange={setNewTask} placeholder="What needs to be done?"/>
        <select value={assignee} onChange={e=>setAssignee(e.target.value)}>{people.map(p=><option key={p.name}>{p.name}</option>)}</select>
        <button className="primary-btn" onClick={addTask}>Create task</button></div>
    </motion.div>}</AnimatePresence>
    <Panel title={`All tasks · ${allCount}`}><div className="task-list">
      {tasks.map(t=><div className="task-row" key={t.id}><div className="task-check" onClick={()=>updateStatus(t.id,t.status==="Done"?"In progress":"Done")} role="button" tabIndex={0}><Check size={14}/></div>
        <div className="task-info"><b className={t.status==="Done"?"completed":""}>{t.title}</b><span>{t.assignee} · Due {t.due}</span></div>
        <select className="status-select" value={t.status} onChange={e=>updateStatus(t.id,e.target.value as TaskStatus)}>{statuses.map(s=><option key={s}>{s}</option>)}</select>
        <button className="icon-btn danger" onClick={()=>deleteTask(t.id)} aria-label="Delete task"><Trash2 size={16}/></button>
      </div>)}
      {!tasks.length && <div className="empty-state">No matching tasks. Try another filter or add a new task.</div>}
    </div></Panel>
  </>;
}
function Chat({messages,value,setValue,send}:{messages:Message[];value:string;setValue:(v:string)=>void;send:()=>void}) {
  return <Panel title="Team conversation" className="chat-panel"><div className="chat-messages">{messages.map(m=><div className={`chat-message ${m.author==="You"?"mine":""}`} key={m.id}><span className="chat-avatar">{m.author[0]}</span><div><div className="chat-meta"><b>{m.author}</b><time>{m.time}</time></div><p>{m.text}</p></div></div>)}</div>
    <div className="chat-compose"><Paperclip size={18}/><SmoothInput value={value} onChange={setValue} placeholder="Write a message..."/><button className="primary-btn" onClick={send}><Send size={16}/> Send</button></div>
  </Panel>;
}
function Meeting({go}:{go:(p:Page)=>void}) {
  return <div className="two-col"><Panel title="Upcoming meeting"><div className="meeting-feature"><div className="date-tile"><b>28</b><span>NOV</span></div><div><h2>Mock demo review</h2><p className="muted">Saturday · 10:30 AM · Project room</p><p>Review timetable flow, alerts, login screens, and open blockers before the faculty demo.</p></div></div><button className="primary-btn" onClick={()=>go("Tasks")}>Review open tasks <ArrowUpRight size={16}/></button></Panel>
    <Panel title="Milestones"><div className="timeline"><div><i/><b>Mock demo</b><span>2026-11-28</span></div><div><i/><b>Final presentation</b><span>2026-12-09</span></div></div></Panel></div>;
}
function FilesPage() {
  const files=[["Campus app research.pdf","Rahul · Research","PDF"],["Final poster draft.png","Nisha · Design","PNG"],["Demo presentation.pptx","Priya · Slides","PPT"],["Timetable wireframes.fig","Kunal · Product","FIG"]];
  return <Panel title="Shared project files"><div className="file-list">{files.map(([name,meta,type])=><div className="file-row" key={name}><div className="file-icon">{type}</div><div><b>{name}</b><span>{meta}</span></div><button className="secondary-btn" onClick={()=>alert(`${name} is a sample file entry. Connect storage to upload real files.`)}>Open <ArrowUpRight size={14}/></button></div>)}</div><p className="muted small file-note">Demo file list based on the TeamFlow workspace. Connect cloud storage to upload and share real documents.</p></Panel>;
}
function MySpace({tasks,notes,setNotes,go}:{tasks:Task[];notes:string;setNotes:(v:string)=>void;go:(p:Page)=>void}) {
  const assigned=tasks.filter(t=>t.assignee==="Aditya");
  return <div className="two-col"><Panel title="My tasks">{assigned.length?assigned.map(t=><div className="simple-row" key={t.id}><b>{t.title}</b><Status status={t.status}/></div>):<p className="muted">No tasks assigned to you yet.</p>}<button className="secondary-btn" onClick={()=>go("Tasks")}>Browse all tasks</button></Panel>
    <Panel title="Personal notes"><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Write down ideas, reminders, or follow-ups..."/><span className="muted small">Saved automatically in this browser.</span></Panel></div>;
}
function Team({go,tasks}:{go:(p:Page)=>void;tasks:Task[]}) {
  return <Panel title="Team members"><div className="team-grid">{people.map(p=><div className="team-card" key={p.name}><span className={`team-avatar ${p.color}`}>{p.name[0]}</span><h3>{p.name}</h3><p>{p.role}</p><div className="team-work">{tasks.filter(t=>t.assignee===p.name).length} active assignment(s)</div><button className="secondary-btn" onClick={()=>go("Tasks")}>View tasks <ArrowUpRight size={14}/></button></div>)}</div></Panel>;
}
function StickyProjects() {
  const cards=[["01","Research","Understand campus needs and map existing student workflows."],["02","Design","Create a clear timetable, alerts, and task experience."],["03","Build","Turn the prototype into a working campus companion."]];
  return <section className="projects-section"><div className="section-heading"><div><p className="eyebrow">SCROLL TO EXPLORE</p><h2>Project flow, <span className="flip-word">step by step</span></h2></div><span className="muted small">Sticky card stack · scroll animation</span></div>
    <div className="sticky-stack">{cards.map((item,i)=><motion.article className="project-card" key={item[0]} style={{top:100+i*18,zIndex:i+1}} whileHover={{scale:1.015,rotate:i%2?1:-1}}><div className="project-number">{item[0]}</div><div><span className="eyebrow">TEAMFLOW / PHASE {item[0]}</span><h3>{item[1]}</h3><p>{item[2]}</p></div><ArrowUpRight size={22}/></motion.article>)}</div>
  </section>;
}
function GlassDock({page,go}:{page:Page;go:(p:Page)=>void}) {
  return <div className="glass-dock">{navItems.slice(0,5).map(({name,icon:Icon})=><button key={name} className={page===name?"dock-active":""} onClick={()=>go(name)} title={name}><Icon size={18}/><span>{name}</span></button>)}</div>;
}
export default App;
