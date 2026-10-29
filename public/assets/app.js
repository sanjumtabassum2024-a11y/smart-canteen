(function () {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const money = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(n)||0);
  const safe = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const placeholder = "/assets/placeholder.svg";
  const api = async (url, options={}) => {
    const r = await fetch(url,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});
    const d = await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(d.message || "Something went wrong.");
    return d;
  };
  const getCart = () => { try { return JSON.parse(sessionStorage.getItem("sc-cart")||"[]"); } catch { return []; } };
  const setCart = c => { sessionStorage.setItem("sc-cart",JSON.stringify(c)); updateCartCount(); };
  const updateCartCount = () => { const el=$("#cartCount"); if(el) el.textContent=getCart().reduce((n,i)=>n+i.quantity,0); };
  const toast = (msg, error=false) => { let el=$("#toast"); if(!el){el=document.createElement("div");el.id="toast";el.style.cssText="position:fixed;right:18px;bottom:18px;z-index:9999;background:#123c2b;color:white;padding:14px 18px;border-radius:12px;box-shadow:0 10px 35px #0002;max-width:calc(100% - 36px)";document.body.append(el);} el.textContent=msg; el.style.background=error?"#9d3028":"#123c2b";el.hidden=false;clearTimeout(window.__scToast);window.__scToast=setTimeout(()=>el.hidden=true,3000); };
  const addToCart = food => { const c=getCart(); const existing=c.find(i=>i.id===food._id); if(existing)existing.quantity++;else c.push({id:food._id,name:food.name,price:food.price,image:food.image||placeholder,quantity:1});setCart(c);toast(food.name+" added to cart."); };
  const cartPage = () => {
    const host=$("#cartRows"); if(!host)return;
    const c=getCart();
    if(!c.length){host.innerHTML='<div class="empty"><strong>Your cart is waiting</strong>Add a delicious meal from the menu.<p><a class="btn btn-primary" href="/menu.html">Explore menu</a></p></div>';$("#cartSummary").innerHTML="";return;}
    host.innerHTML=c.map(i=>`<div class="cart-row"><img src="${safe(i.image)}" onerror="this.onerror=null;this.src='${placeholder}'" alt=""><div><h3>${safe(i.name)}</h3><p>${money(i.price)} each</p><div class="qty"><button data-qty="${safe(i.id)}" data-delta="-1">−</button><strong>${i.quantity}</strong><button data-qty="${safe(i.id)}" data-delta="1">+</button><button class="btn-danger btn" data-remove="${safe(i.id)}">Remove</button></div></div><strong>${money(i.price*i.quantity)}</strong></div>`).join("");
    const total=c.reduce((n,i)=>n+i.price*i.quantity,0);
    $("#cartSummary").innerHTML=`<div class="summary-line"><span>Items</span><strong>${c.reduce((n,i)=>n+i.quantity,0)}</strong></div><div class="summary-line summary-total"><span>Total</span><strong>${money(total)}</strong></div><a class="btn btn-primary" style="width:100%;margin-top:12px" href="/checkout.html">Continue to checkout →</a>`;
  };
  const bindCartPage = () => {
    const host=$("#cartRows"); if(!host)return;
    host.addEventListener("click",e=>{
      const q=e.target.closest("[data-qty]"),r=e.target.closest("[data-remove]");let c=getCart();
      if(q){const i=c.find(x=>x.id===q.dataset.qty);if(i)i.quantity+=Number(q.dataset.delta);c=c.filter(x=>x.quantity>0);setCart(c);cartPage();}
      if(r){setCart(c.filter(x=>x.id!==r.dataset.remove));cartPage();}
    });
    cartPage();
  };
  const menuPage = async () => {
    const host=$("#foodGrid");if(!host)return;
    host.innerHTML='<div class="empty">Loading fresh food…</div>';
    try{
      const foods=await api("/api/foods");
      let category="All",query="";
      const draw=()=>{
        const shown=foods.filter(f=>f.available!==false&&(category==="All"||f.category.toLowerCase()===category.toLowerCase())&&(`${f.name} ${f.description}`.toLowerCase().includes(query)));
        host.innerHTML=shown.length?shown.map(f=>`<article class="food-card"><img class="food-image" src="${safe(f.image||placeholder)}" alt="${safe(f.name)}" loading="lazy" onerror="this.onerror=null;this.src='${placeholder}'"><div class="food-body"><div class="food-meta"><span class="food-category">${safe(f.category)}</span><span class="available">● Available</span></div><h3>${safe(f.name)}</h3><p>${safe(f.description)}</p><div class="food-foot"><span class="price">${money(f.price)}</span><button class="add-btn" data-add="${safe(f._id)}" aria-label="Add ${safe(f.name)}">+</button></div></div></article>`).join(""):'<div class="empty">No items match your search.</div>';
        $$(".chip").forEach(b=>b.classList.toggle("active",b.dataset.category===category));
      };
      $("#foodSearch")?.addEventListener("input",e=>{query=e.target.value.toLowerCase().trim();draw();});
      $("#categoryChips")?.addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(b){category=b.dataset.category;draw();}});
      host.addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(b){const food=foods.find(f=>f._id===b.dataset.add);if(food)addToCart(food);}});
      draw();
    }catch(e){host.innerHTML=`<div class="empty"><strong>Menu couldn't load</strong>${safe(e.message)}<p><button class="btn btn-primary" id="retryMenu">Try again</button></p></div>`;$("#retryMenu")?.addEventListener("click",menuPage);}
  };
  const checkoutPage = () => {
    const form=$("#checkoutForm");if(!form)return;
    const c=getCart();const total=c.reduce((n,i)=>n+i.price*i.quantity,0);
    if(!c.length){$("#checkoutSummary").innerHTML='<div class="notice">Your cart is empty. <a href="/menu.html"><u>Browse the menu</u></a>.</div>';form.querySelector("button[type=submit]").disabled=true;return;}
    $("#checkoutSummary").innerHTML=c.map(i=>`<div class="summary-line"><span>${safe(i.name)} × ${i.quantity}</span><strong>${money(i.price*i.quantity)}</strong></div>`).join("")+`<div class="summary-line summary-total"><span>Total</span><strong>${money(total)}</strong></div>`;
    form.addEventListener("submit",async e=>{
      e.preventDefault();const btn=form.querySelector("button[type=submit]");btn.disabled=true;btn.textContent="Placing order…";
      try{
        const payload={customerName:$("#customerName").value.trim(),customerEmail:$("#customerEmail").value.trim(),customerPhone:$("#customerPhone").value.trim(),paymentMethod:$("#paymentMethod").value,items:c.map(i=>({foodId:i.id,quantity:i.quantity}))};
        const result=await api("/api/orders",{method:"POST",body:JSON.stringify(payload)});
        sessionStorage.removeItem("sc-cart");sessionStorage.setItem("sc-last-order",result.order._id);
        location.href="/order-success.html";
      }catch(err){toast(err.message,true);btn.disabled=false;btn.textContent="Place order";}
    });
  };
  const successPage = () => {
    const host=$("#successDetails");if(!host)return;
    const id=sessionStorage.getItem("sc-last-order");
    if(!id){host.innerHTML='<p>No recent order found. <a href="/menu.html">Start an order</a>.</p>';return;}
    host.innerHTML=`<div class="notice">Order placed! Your order ID is shown below.</div><div class="panel"><span class="eyebrow">YOUR ORDER ID</span><h2 style="word-break:break-all">${safe(id)}</h2><p>Save this ID to track your order.</p><a class="btn btn-primary" href="/track-order.html?id=${encodeURIComponent(id)}">Track this order →</a></div>`;
  };
  const trackingPage = () => {
    const form=$("#trackForm");if(!form)return;
    const params=new URLSearchParams(location.search);if(params.get("id"))$("#orderId").value=params.get("id");
    const display=order=>{
      const statuses=["Placed","Preparing","Ready for pickup","Completed","Cancelled"];
      const active=statuses.indexOf(order.status);
      $("#trackResult").innerHTML=`<div class="panel"><div class="food-meta"><h2>Order status</h2><span class="status">${safe(order.status)}</span></div><p>Order <strong>${safe(order._id)}</strong></p><p>Placed ${new Date(order.createdAt).toLocaleString()}</p><div class="track-steps">${statuses.filter(s=>s!=="Cancelled").map((s,i)=>`<div class="track-step ${active>=i&&order.status!=="Cancelled"?"done":""}">${i+1}. ${s}</div>`).join("")}</div><h3>Order total: ${money(order.total)}</h3><p>${order.items.map(i=>`${safe(i.name)} × ${i.quantity}`).join(" · ")}</p></div>`;
    };
    form.addEventListener("submit",async e=>{e.preventDefault();$("#trackResult").innerHTML='<div class="notice">Checking order…</div>';try{const d=await api("/api/orders/"+encodeURIComponent($("#orderId").value.trim()));display(d.order||d);}catch(err){$("#trackResult").innerHTML=`<div class="notice error">${safe(err.message)}</div>`;}});
    if(params.get("id"))form.requestSubmit();
  };
  const adminLogin = () => {
    const form=$("#adminLoginForm");if(!form)return;
    form.addEventListener("submit",async e=>{e.preventDefault();const btn=form.querySelector("button");btn.disabled=true;$("#loginMessage").textContent="Signing in…";try{await api("/api/admin/login",{method:"POST",body:JSON.stringify({email:$("#adminEmail").value,password:$("#adminPassword").value})});location.href="/admin/dashboard.html";}catch(err){$("#loginMessage").textContent=err.message;btn.disabled=false;}});
  };
  const adminPage = async () => {
    if(!document.body.dataset.adminPage)return;
    try{const me=await api("/api/admin/me");$("#adminName").textContent=me.name; }catch{location.href="/admin/login.html";return;}
    $("#adminLogout")?.addEventListener("click",async()=>{await api("/api/admin/logout",{method:"POST"});location.href="/admin/login.html";});
    const page=document.body.dataset.adminPage;
    if(page==="dashboard"){
      const s=await api("/api/admin/stats");$("#stats").innerHTML=[["Menu items",s.foods],["Total orders",s.orders],["New orders",s.placed],["Order value",money(s.revenue)]].map(([a,b])=>`<div class="stat"><span>${a}</span><strong>${b}</strong></div>`).join("");
      const orders=await api("/api/admin/orders");$("#recentOrders").innerHTML=orders.slice(0,6).map(o=>`<tr><td>${safe(o._id.slice(-8).toUpperCase())}</td><td>${safe(o.customerName)}</td><td>${money(o.total)}</td><td><span class="status">${safe(o.status)}</span></td></tr>`).join("")||'<tr><td colspan="4">No orders yet.</td></tr>';
    }
    if(page==="foods") adminFoods();
    if(page==="orders") adminOrders();
  };
  const adminFoods = async () => {
    const host=$("#adminFoods"),form=$("#foodForm");
    const draw=async()=>{const foods=await api("/api/admin/foods");host.innerHTML=foods.map(f=>`<tr><td>${safe(f.name)}</td><td>${safe(f.category)}</td><td>${money(f.price)}</td><td>${f.available?"Available":"Hidden"}</td><td><button class="btn btn-light" data-toggle-food="${f._id}" data-next="${!f.available}">${f.available?"Hide":"Show"}</button> <button class="btn btn-danger" data-delete-food="${f._id}">Delete</button></td></tr>`).join("")||'<tr><td colspan="5">No food items yet.</td></tr>';};
    await draw();
    form?.addEventListener("submit",async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form));data.price=Number(data.price);data.available=true;try{await api("/api/admin/foods",{method:"POST",body:JSON.stringify(data)});form.reset();await draw();toast("Food item added.");}catch(err){toast(err.message,true);}});
    host?.addEventListener("click",async e=>{const t=e.target.closest("[data-toggle-food]"),d=e.target.closest("[data-delete-food]");try{if(t)await api("/api/admin/foods/"+t.dataset.toggleFood,{method:"PATCH",body:JSON.stringify({available:t.dataset.next==="true"})});if(d&&confirm("Delete this food item?"))await api("/api/admin/foods/"+d.dataset.deleteFood,{method:"DELETE"});await draw();}catch(err){toast(err.message,true);}});
  };
  const adminOrders = async () => {
    const host=$("#adminOrders");const statuses=["Placed","Preparing","Ready for pickup","Completed","Cancelled"];
    const draw=async()=>{const orders=await api("/api/admin/orders");host.innerHTML=orders.map(o=>`<tr><td title="${safe(o._id)}">${safe(o._id.slice(-8).toUpperCase())}</td><td>${safe(o.customerName)}<br><small>${safe(o.customerPhone)}</small></td><td>${o.items.map(i=>`${safe(i.name)} × ${i.quantity}`).join("<br>")}</td><td>${money(o.total)}</td><td><select data-order-status="${o._id}">${statuses.map(s=>`<option ${s===o.status?"selected":""}>${s}</option>`).join("")}</select></td><td>${new Date(o.createdAt).toLocaleString()}</td></tr>`).join("")||'<tr><td colspan="6">No orders yet.</td></tr>';};
    await draw();
    host.addEventListener("change",async e=>{const s=e.target.closest("[data-order-status]");if(!s)return;try{await api("/api/admin/orders/"+s.dataset.orderStatus,{method:"PATCH",body:JSON.stringify({status:s.value})});toast("Order status updated.");}catch(err){toast(err.message,true);} });
  };
  document.addEventListener("DOMContentLoaded",()=>{
    updateCartCount();menuPage();bindCartPage();checkoutPage();successPage();trackingPage();adminLogin();
    if(document.body.dataset.adminPage)adminPage().catch(e=>toast(e.message,true));
  });
})();
