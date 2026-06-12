let selectedService="";
let selectedMerchant=null;
let recoveryCode="";
let missionCreated=false;
let secureParcel=false;
let cart=[];
let pendingAuthMode="login";
let pendingSmsCode="123456";

let userLocation={lat:48.8566,lng:2.3522,source:"Position simulée Paris"};
const NAVIX_RADIUS_KM=1.5;

const merchants=[
  {id:1,type:"restaurant",name:"Le Gourmet Burger",address:"12 rue Centrale",distanceKm:0.4,robotX:30,robotY:55},
  {id:2,type:"restaurant",name:"Quick Tacos",address:"8 avenue Nord",distanceKm:0.9,robotX:60,robotY:30},
  {id:3,type:"restaurant",name:"Pizza Urban",address:"21 rue des Lilas",distanceKm:1.3,robotX:95,robotY:45},
  {id:4,type:"courses",name:"City Market",address:"5 place du Marché",distanceKm:0.5,robotX:35,robotY:40},
  {id:5,type:"courses",name:"Franprix Express",address:"3 rue Victor Hugo",distanceKm:1.1,robotX:75,robotY:50}
];

const catalog={
  restaurant:[
    {id:"m1",category:"Menus",name:"Menu Burger Classic",description:"Burger, frites et boisson",price:14.90,emoji:"🍔"},
    {id:"m2",category:"Menus",name:"Menu Chicken",description:"Sandwich chicken, frites et boisson",price:13.50,emoji:"🍗"},
    {id:"m3",category:"Menus",name:"Menu Tacos",description:"Tacos, frites et boisson",price:12.90,emoji:"🌯"},
    {id:"p1",category:"Plats seuls",name:"Burger seul",description:"Burger classic sans menu",price:9.90,emoji:"🍔"},
    {id:"p2",category:"Plats seuls",name:"Tacos seul",description:"Tacos viande au choix",price:8.90,emoji:"🌯"},
    {id:"p3",category:"Plats seuls",name:"Pizza individuelle",description:"Pizza format solo",price:10.90,emoji:"🍕"},
    {id:"s1",category:"Accompagnements",name:"Frites",description:"Portion classique",price:3.50,emoji:"🍟"},
    {id:"s2",category:"Accompagnements",name:"Nuggets",description:"6 pièces",price:4.90,emoji:"🍗"},
    {id:"d1",category:"Boissons",name:"Coca-Cola",description:"33 cl",price:2.20,emoji:"🥤"},
    {id:"d2",category:"Boissons",name:"Eau minérale",description:"50 cl",price:1.50,emoji:"💧"}
  ],
  courses:[
    {id:"c1",category:"Boissons",name:"Pack d'eau",description:"6 bouteilles",price:3.20,emoji:"💧"},
    {id:"c2",category:"Boissons",name:"Jus d'orange",description:"1 litre",price:2.80,emoji:"🧃"},
    {id:"c3",category:"Snacks",name:"Chips",description:"Grand paquet",price:2.50,emoji:"🥔"},
    {id:"c4",category:"Snacks",name:"Biscuits",description:"Paquet familial",price:2.90,emoji:"🍪"},
    {id:"c5",category:"Boulangerie",name:"Baguette",description:"Pain frais",price:1.20,emoji:"🥖"},
    {id:"c6",category:"Fruits",name:"Pommes",description:"Lot de 4",price:3.00,emoji:"🍎"},
    {id:"c7",category:"Hygiène",name:"Dentifrice",description:"Tube classique",price:2.40,emoji:"🪥"},
    {id:"c8",category:"Hygiène",name:"Mouchoirs",description:"Boîte de mouchoirs",price:1.80,emoji:"🧻"}
  ]
};

function showScreen(screenId){
  document.querySelectorAll(".screen").forEach(screen=>screen.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
}

function showAuthMode(mode){
  loginForm.classList.add("hidden");
  signupForm.classList.add("hidden");
  phoneForm.classList.add("hidden");
  loginTab.classList.remove("active");
  signupTab.classList.remove("active");
  phoneTab.classList.remove("active");

  if(mode==="login"){
    loginForm.classList.remove("hidden");
    loginTab.classList.add("active");
  }
  if(mode==="signup"){
    signupForm.classList.remove("hidden");
    signupTab.classList.add("active");
  }
  if(mode==="phone"){
    phoneForm.classList.remove("hidden");
    phoneTab.classList.add("active");
  }
}

function login(){
  if(!emailInput.value || !passwordInput.value){
    alert("Veuillez renseigner un email et un mot de passe.");
    return;
  }
  const user={
    name:emailInput.value.split("@")[0],
    email:emailInput.value,
    phone:"",
    authMethod:"email"
  };
  saveSession(user);
}

function createAccount(){
  if(!signupNameInput.value || !signupEmailInput.value || !signupPasswordInput.value || !signupPhoneInput.value){
    alert("Veuillez compléter tous les champs.");
    return;
  }
  if(signupPasswordInput.value.length<6){
    alert("Le mot de passe doit contenir au moins 6 caractères.");
    return;
  }
  const user={
    name:signupNameInput.value,
    email:signupEmailInput.value,
    phone:signupPhoneInput.value,
    authMethod:"account"
  };
  saveSession(user);
}

function sendSmsCode(){
  if(!phoneInput.value){
    alert("Veuillez saisir un numéro de téléphone.");
    return;
  }
  pendingAuthMode="phone";
  pendingSmsCode=Math.floor(100000+Math.random()*900000).toString();
  smsInfo.textContent="SMS simulé envoyé. Code : "+pendingSmsCode;
  otpHelp.textContent="Code SMS simulé : "+pendingSmsCode;
  showScreen("verifyScreen");
}

function verifyCode(){
  const expectedCode=pendingAuthMode==="phone" ? pendingSmsCode : "123456";
  if(otpInput.value===expectedCode){
    const user={
      name:"Utilisateur NAVIX",
      email:"",
      phone:phoneInput.value,
      authMethod:"phone"
    };
    saveSession(user);
  }else{
    alert("Code incorrect.");
  }
}

function saveSession(user){
  localStorage.setItem("navix_user",JSON.stringify(user));
  updateConnectedUser(user);
  showScreen("homeScreen");
}

function checkExistingSession(){
  const storedUser=localStorage.getItem("navix_user");
  if(storedUser){
    const user=JSON.parse(storedUser);
    updateConnectedUser(user);
    showScreen("homeScreen");
  }
}

function updateConnectedUser(user){
  connectedUserText.textContent=user.phone
    ? "Connecté avec "+user.phone
    : "Connecté avec "+user.email;
}

function logout(){
  localStorage.removeItem("navix_user");
  otpInput.value="";
  showScreen("loginScreen");
}

function getUserLocation(){
  if(!navigator.geolocation){
    locationText.textContent="Géolocalisation non disponible. Position simulée utilisée.";
    return;
  }
  navigator.geolocation.getCurrentPosition(
    position=>{
      userLocation={lat:position.coords.latitude,lng:position.coords.longitude,source:"Position réelle du smartphone"};
      locationText.textContent="Localisation activée : "+userLocation.lat.toFixed(4)+", "+userLocation.lng.toFixed(4);
    },
    ()=>{locationText.textContent="Localisation refusée. Position simulée utilisée.";}
  );
}

function selectService(service){
  selectedService=service;
  selectedMerchant=null;
  cart=[];
  if(service==="restaurant" || service==="courses"){
    displayNearbyMerchants(service);
    showScreen("merchantScreen");
  }else{
    updateSecureOptionVisibility();
    updatePrice();
    showScreen("parcelScreen");
  }
}

function displayNearbyMerchants(service){
  merchantTitle.textContent=service==="restaurant" ? "Restaurants proches" : "Commerces proches";
  merchantList.innerHTML="";
  const filtered=merchants.filter(m=>m.type===service && m.distanceKm<=NAVIX_RADIUS_KM);
  filtered.forEach(merchant=>{
    const card=document.createElement("div");
    card.className="merchant-card";
    card.onclick=()=>chooseMerchant(merchant.id);
    card.innerHTML=`
      <div class="row">
        <div>
          <h3>${merchant.name}</h3>
          <p class="muted">${merchant.address}</p>
        </div>
        <span class="badge">${merchant.distanceKm} km</span>
      </div>
      <p class="small">Disponible dans le rayon NAVIX</p>
    `;
    merchantList.appendChild(card);
  });
}

function chooseMerchant(id){
  selectedMerchant=merchants.find(m=>m.id===id);
  cart=[];
  renderCatalog();
  showScreen("catalogScreen");
}

function renderCatalog(activeCategory=null){
  catalogTitle.textContent=selectedMerchant.name;
  catalogSubtitle.textContent=selectedMerchant.address+" • "+selectedMerchant.distanceKm+" km";

  const products=catalog[selectedService];
  const categories=[...new Set(products.map(p=>p.category))];
  const currentCategory=activeCategory || categories[0];

  categoryTabs.innerHTML="";
  categories.forEach(category=>{
    const btn=document.createElement("button");
    btn.className="tab"+(category===currentCategory?" active":"");
    btn.textContent=category;
    btn.onclick=()=>renderCatalog(category);
    categoryTabs.appendChild(btn);
  });

  productList.innerHTML="";
  products.filter(p=>p.category===currentCategory).forEach(product=>{
    const card=document.createElement("div");
    card.className="product-card";
    card.innerHTML=`
      <div class="row">
        <div class="product-img">${product.emoji}</div>
        <div class="product-info">
          <h3>${product.name}</h3>
          <p class="small">${product.description}</p>
          <p class="price">${formatPrice(product.price)}</p>
        </div>
        <button class="add-btn" onclick="addToCart('${product.id}')">+</button>
      </div>
    `;
    productList.appendChild(card);
  });
  updateCartBar();
}

function addToCart(productId){
  const product=catalog[selectedService].find(p=>p.id===productId);
  const existing=cart.find(item=>item.id===productId);
  if(existing){existing.quantity++;}
  else{cart.push({...product,quantity:1});}
  updateCartBar();
}

function changeQuantity(productId,delta){
  const item=cart.find(i=>i.id===productId);
  if(!item)return;
  item.quantity+=delta;
  if(item.quantity<=0){cart=cart.filter(i=>i.id!==productId);}
  renderCart();
  updateCartBar();
}

function getCartTotal(){return cart.reduce((sum,item)=>sum+(item.price*item.quantity),0);}
function getCartCount(){return cart.reduce((sum,item)=>sum+item.quantity,0);}

function updateCartBar(){
  const count=getCartCount();
  cartCount.textContent=count+" article"+(count>1?"s":"");
  cartTotal.textContent="Total : "+formatPrice(getCartTotal());
}

function goToDeliveryDetails(){
  if(cart.length===0){
    alert("Votre panier est vide.");
    return;
  }
  renderCart();
  showScreen("cartScreen");
}

function renderCart(){
  if(cart.length===0){
    cartItems.innerHTML="<p class='empty-cart'>Votre panier est vide.</p>";
    return;
  }
  cartItems.innerHTML=cart.map(item=>`
    <div class="cart-item">
      <div>
        <strong>${item.name}</strong>
        <p class="small">${formatPrice(item.price)} x ${item.quantity}</p>
      </div>
      <div class="cart-controls">
        <button class="qty-btn" onclick="changeQuantity('${item.id}',-1)">-</button>
        <span>${item.quantity}</span>
        <button class="qty-btn" onclick="changeQuantity('${item.id}',1)">+</button>
      </div>
    </div>
  `).join("")+`<p class="total"><strong>Total articles : ${formatPrice(getCartTotal())}</strong></p>`;
}

function goToPaymentFromCart(){
  if(!deliveryInput.value){
    alert("Veuillez renseigner une adresse de livraison.");
    return;
  }
  summaryService.textContent=selectedService==="restaurant" ? "Restaurant / Fast-food" : "Courses";
  summaryMerchantLine.classList.remove("hidden");
  summaryCartLine.classList.remove("hidden");
  summaryMerchant.textContent=selectedMerchant.name;
  summaryCart.textContent=formatPrice(getCartTotal());
  updatePrice();
  showScreen("paymentScreen");
}

function goToPaymentFromParcel(){
  if(!pickupInput.value || !parcelDeliveryInput.value || !parcelTypeInput.value || !parcelDescriptionInput.value){
    alert("Veuillez compléter les informations du colis.");
    return;
  }
  summaryService.textContent="Colis";
  summaryMerchantLine.classList.add("hidden");
  summaryCartLine.classList.add("hidden");
  updatePrice();
  showScreen("paymentScreen");
}

function backFromPayment(){
  if(selectedService==="colis"){showScreen("parcelScreen");}
  else{showScreen("cartScreen");}
}

function updateSecureOptionVisibility(){
  const weightValue=weightInput.value;
  if(selectedService==="colis" && weightValue==="under3"){
    secureOptionBlock.classList.remove("hidden");
    secureHelpText.textContent="Disponible : colis inférieur à 3 kg.";
  }else{
    secureParcelInput.checked=false;
    secureOptionBlock.classList.add("hidden");
    secureHelpText.textContent="Option désactivée : uniquement disponible sous 3 kg.";
  }
}

function updatePrice(){
  secureParcel=secureParcelInput?.checked || false;
  let total=3.50;
  if(selectedService==="restaurant" || selectedService==="courses"){
    total+=getCartTotal();
  }
  if(selectedService==="colis" && secureParcel){
    total+=1.50;
    secureFeeLine.classList.remove("hidden");
  }else{
    secureFeeLine.classList.add("hidden");
  }
  totalPrice.textContent=formatPrice(total);
}

// ── APPEL DE COMMANDE SÉRIE COMPATIBLE AVEC LÉA ──
function createMission(){
  let target=getRobotTargetCoordinates();

  const mission={
    service:selectedService,
    userLocation:userLocation,
    robotId:"NAVIX_ROBOT_01",
    targetX:target.x,
    targetY:target.y,
    status:"confirmed"
  };

  if(selectedService==="restaurant" || selectedService==="courses"){
    mission.merchant=selectedMerchant.name;
    mission.pickup=selectedMerchant.address;
    mission.delivery=deliveryInput.value;
    mission.items=cart.map(item=>({name:item.name,quantity:item.quantity,price:item.price}));
    mission.totalArticles=getCartTotal();
  }

  if(selectedService==="colis"){
    mission.pickup=pickupInput.value;
    mission.delivery=parcelDeliveryInput.value;
    mission.parcelType=parcelTypeInput.value;
    mission.parcelDescription=parcelDescriptionInput.value;
    mission.weight=weightInput.value;
    mission.secureParcel=secureParcelInput.checked;
  }

  recoveryCode=Math.floor(1000+Math.random()*9000).toString();
  recoveryCodeDisplay.textContent=recoveryCode;

  // Format exact attendu par l'Arduino de Léa
  const commandText = `GOTO:${mission.targetX},${mission.targetY}`;
  robotCommandBox.textContent=commandText;
  missionCreated=true;

  // Envoi réel au serveur Python sur le Raspberry Pi
  fetch('/api/commande', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: commandText })
  })
  .then(res => res.json())
  .then(data => console.log("Réponse Raspberry :", data))
  .catch(err => console.error("Erreur transmission :", err));

  showScreen("trackingScreen");
  resetTrackingUI();
  simulateRobotProgress();
}

function getRobotTargetCoordinates(){
  if(selectedMerchant){return {x:selectedMerchant.robotX,y:selectedMerchant.robotY};}
  return {x:80,y:60};
}

function resetTrackingUI(){
  progressBar.style.width="10%";
  eta.textContent="15 min";
  robotDot.style.left="35px";
  robotDot.style.top="180px";
  openMessage.textContent="";
  document.querySelectorAll("#statusList li").forEach((item,index)=>{
    index===0 ? item.classList.add("done") : item.classList.remove("done");
  });
}

function simulateRobotProgress(){
  const steps=[
    {progress:"25%",eta:"12 min",left:"85px",top:"145px",statusIndex:1},
    {progress:"55%",eta:"8 min",left:"145px",top:"105px",statusIndex:2},
    {progress:"85%",eta:"3 min",left:"220px",top:"65px",statusIndex:2},
    {progress:"100%",eta:"Arrivé",left:"285px",top:"42px",statusIndex:3}
  ];
  let step=0;
  const interval=setInterval(()=>{
    const current=steps[step];
    progressBar.style.width=current.progress;
    eta.textContent=current.eta;
    robotDot.style.left=current.left;
    robotDot.style.top=current.top;
    document.querySelectorAll("#statusList li")[current.statusIndex].classList.add("done");
    step++;
    if(step>=steps.length)clearInterval(interval);
  },2500);
}

// ── DÉCLENCHEMENT DE L'OUVERTURE DE LA TRAPPE DE LÉA ──
function openRobot(){
  if(!missionCreated){
    alert("Aucune mission active.");
    return;
  }

  const userCode=prompt("Entrez le code de récupération affiché dans l'application :");
  if(userCode===recoveryCode){
    openMessage.textContent="Compartiment ouvert : code vérifié avec succès.";
    
    // Envoi de la commande OPEN à l'Arduino via le Raspberry Pi
    fetch('/api/commande', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmd: "OPEN" })
    });
  } else {
    openMessage.textContent="Code incorrect : ouverture refusée.";
  }
}

function formatPrice(value){return value.toFixed(2).replace(".",",")+" €";}

// DOM element shortcuts
const loginForm=document.getElementById("loginForm");
const signupForm=document.getElementById("signupForm");
const phoneForm=document.getElementById("phoneForm");
const loginTab=document.getElementById("loginTab");
const signupTab=document.getElementById("signupTab");
const phoneTab=document.getElementById("phoneTab");
const emailInput=document.getElementById("emailInput");
const passwordInput=document.getElementById("passwordInput");
const signupNameInput=document.getElementById("signupNameInput");
const signupEmailInput=document.getElementById("signupEmailInput");
const signupPasswordInput=document.getElementById("signupPasswordInput");
const signupPhoneInput=document.getElementById("signupPhoneInput");
const phoneInput=document.getElementById("phoneInput");
const smsInfo=document.getElementById("smsInfo");
const otpInput=document.getElementById("otpInput");
const otpHelp=document.getElementById("otpHelp");
const connectedUserText=document.getElementById("connectedUserText");
const locationText=document.getElementById("locationText");
const merchantTitle=document.getElementById("merchantTitle");
const merchantList=document.getElementById("merchantList");
const catalogTitle=document.getElementById("catalogTitle");
const catalogSubtitle=document.getElementById("catalogSubtitle");
const categoryTabs=document.getElementById("categoryTabs");
const productList=document.getElementById("productList");
const cartCount=document.getElementById("cartCount");
const cartTotal=document.getElementById("cartTotal");
const cartItems=document.getElementById("cartItems");
const deliveryInput=document.getElementById("deliveryInput");
const summaryService=document.getElementById("summaryService");
const summaryMerchant=document.getElementById("summaryMerchant");
const summaryCart=document.getElementById("summaryCart");
const summaryMerchantLine=document.getElementById("summaryMerchantLine");
const summaryCartLine=document.getElementById("summaryCartLine");
const secureFeeLine=document.getElementById("secureFeeLine");
const totalPrice=document.getElementById("totalPrice");
const pickupInput=document.getElementById("pickupInput");
const parcelDeliveryInput=document.getElementById("parcelDeliveryInput");
const parcelTypeInput=document.getElementById("parcelTypeInput");
const parcelDescriptionInput=document.getElementById("parcelDescriptionInput");
const weightInput=document.getElementById("weightInput");
const secureOptionBlock=document.getElementById("secureOptionBlock");
const secureParcelInput=document.getElementById("secureParcelInput");
const secureHelpText=document.getElementById("secureHelpText");
const recoveryCodeDisplay=document.getElementById("recoveryCode");
const robotCommandBox=document.getElementById("robotCommand");
const progressBar=document.getElementById("progressBar");
const eta=document.getElementById("eta");
const robotDot=document.getElementById("robotDot");
const openMessage=document.getElementById("openMessage");

checkExistingSession();