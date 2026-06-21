// Fallback static datasets (used when backend is offline)
const FALLBACK_ACTIONS_DATA = [
  {
    id: "switch-led",
    title: "Switch to LED Bulbs",
    description: "Replace standard incandescent lightbulbs with energy-star certified LEDs.",
    category: "easy",
    points: 15,
    co2Saved: 150 // kg CO2e / year
  },
  {
    id: "unplug-standby",
    title: "Vanquish Standby Power",
    description: "Unplug chargers, televisions, and game consoles when not in use, or use smart power strips.",
    category: "easy",
    points: 10,
    co2Saved: 50
  },
  {
    id: "wash-cold",
    title: "Wash Laundry on Cold",
    description: "Use cold water settings for laundry loads. 75% to 90% of washing machine energy goes into heating water.",
    category: "easy",
    points: 15,
    co2Saved: 80
  },
  {
    id: "meat-free-monday",
    title: "Meat-Free Days",
    description: "Commit to eating plant-based meals at least one or two days per week.",
    category: "easy",
    points: 20,
    co2Saved: 180
  },
  {
    id: "compost-waste",
    title: "Start Composting Food Scraps",
    description: "Compost organic waste instead of throwing it in trash, preventing methane emissions in landfills.",
    category: "medium",
    points: 30,
    co2Saved: 200
  },
  {
    id: "commute-bike",
    title: "Walk or Bike Short Trips",
    description: "For trips under 2 miles, walk or ride a bike instead of taking a gasoline vehicle.",
    category: "medium",
    points: 40,
    co2Saved: 450
  },
  {
    id: "smart-thermostat",
    title: "Install a Smart Thermostat",
    description: "Optimize home heating and cooling schedules to save energy when sleeping or away.",
    category: "medium",
    points: 35,
    co2Saved: 320
  },
  {
    id: "dry-line",
    title: "Air-Dry Your Clothes",
    description: "Skip the electric dryer and use a clothesline or drying rack to dry garments.",
    category: "medium",
    points: 25,
    co2Saved: 200
  },
  {
    id: "solar-panels",
    title: "Rooftop Solar Panels",
    description: "Install domestic solar panels to generate zero-emission electricity at home.",
    category: "hard",
    points: 100,
    co2Saved: 1800
  },
  {
    id: "upgrade-ev",
    title: "Upgrade to an Electric Vehicle",
    description: "Replace a traditional gasoline vehicle with an electric or plug-in hybrid vehicle.",
    category: "hard",
    points: 90,
    co2Saved: 2400
  },
  {
    id: "heat-pump",
    title: "Switch to a Heat Pump System",
    description: "Replace standard gas/oil furnace with a high-efficiency electric heat pump.",
    category: "hard",
    points: 85,
    co2Saved: 1400
  }
];

const FALLBACK_BADGES_DATA = [
  {
    id: "first-calc",
    title: "First Eco-Step",
    description: "Completed your first carbon footprint calculation.",
    icon: "footprint",
    requirementText: "Complete calculation"
  },
  {
    id: "green-advocate",
    title: "Green Advocate",
    description: "Committed to 3 carbon-reducing green actions.",
    icon: "check-circle",
    requirementText: "3 commitments"
  },
  {
    id: "points-100",
    title: "Eco Champion",
    description: "Earned 100 Eco Points from active commitments.",
    icon: "award",
    requirementText: "100 Eco Points"
  },
  {
    id: "carbon-cutter",
    title: "Carbon Clipper",
    description: "Reduced your carbon footprint by 500 kg CO₂e.",
    icon: "scissors",
    requirementText: "Save 500 kg CO₂"
  },
  {
    id: "planet-saver",
    title: "Planet Guardian",
    description: "Unleased high-impact reductions (saved 1,500+ kg CO₂e).",
    icon: "globe",
    requirementText: "Save 1,500 kg CO₂"
  }
];

// Active datasets
let ACTIONS_DATA = [...FALLBACK_ACTIONS_DATA];
let BADGES_DATA = [...FALLBACK_BADGES_DATA];

// Backend API configuration
const API_BASE = "http://127.0.0.1:5000/api";
let isBackendOnline = false;

// Application State
let state = {
  isCalculated: false,
  inputs: {
    carMiles: 0,
    carType: "none",
    publicTransit: 0,
    flightHours: 0,
    homeMembers: 1,
    electricityBill: 150,
    cleanEnergy: false,
    heatingFuel: "natural-gas",
    dietType: "meat-average",
    foodWaste: "average",
    localFood: false,
    shoppingLevel: "average",
    recyclingHabits: "partial"
  },
  results: {
    transport: 0,
    energy: 0,
    food: 0,
    shopping: 0,
    total: 0
  },
  commitments: [], // Array of action IDs
  ecoPoints: 0,
  savedCO2: 0, // In kg
  unlockedBadges: [] // Array of badge IDs
};

// Global Chart Instance
let footprintChartInstance = null;

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

// Initial load check
async function initApp() {
  try {
    console.log("Checking backend connection...");
    const actionsRes = await fetch(`${API_BASE}/actions`);
    if (actionsRes.ok) {
      ACTIONS_DATA = await actionsRes.json();
      isBackendOnline = true;
    }
    
    const badgesRes = await fetch(`${API_BASE}/badges`);
    if (badgesRes.ok) {
      BADGES_DATA = await badgesRes.json();
    }
    console.log("EcoTrace backend connected. Database synchronized.");
  } catch (e) {
    console.warn("EcoTrace backend offline. Running in Local Storage Fallback mode.", e);
    isBackendOnline = false;
  }
  
  await loadState();
  setupNav();
  setupCalculator();
  setupActionsPage();
  setupTopHeaderActions();
  updateUI();
  lucide.createIcons();
}

// Load state from DB or LocalStorage
async function loadState() {
  if (isBackendOnline) {
    try {
      const res = await fetch(`${API_BASE}/user/load?username=default_user`);
      const data = await res.json();
      if (data.status === "success" && data.found) {
        state = data.state;
        return;
      }
    } catch (e) {
      console.error("Failed to load user state from server, falling back to local storage...", e);
    }
  }

  // Local storage fallback
  const savedState = localStorage.getItem("ecotrace_state");
  if (savedState) {
    try {
      state = JSON.parse(savedState);
    } catch (e) {
      console.error("Error parsing saved state, resetting...", e);
    }
  }
}

// Save state to DB & LocalStorage
async function saveState() {
  // Always save to localStorage as backup
  localStorage.setItem("ecotrace_state", JSON.stringify(state));
  
  if (isBackendOnline) {
    try {
      await fetch(`${API_BASE}/user/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: "default_user",
          state: state
        })
      });
    } catch (e) {
      console.error("Failed to sync user state with backend server.", e);
    }
  }
}

// Reset State
function setupTopHeaderActions() {
  const btnReset = document.getElementById("btn-reset");
  if (btnReset) {
    btnReset.addEventListener("click", async () => {
      if (confirm("Are you sure you want to reset all your entries, active commitments, and points?")) {
        state = {
          isCalculated: false,
          inputs: {
            carMiles: 0,
            carType: "none",
            publicTransit: 0,
            flightHours: 0,
            homeMembers: 1,
            electricityBill: 150,
            cleanEnergy: false,
            heatingFuel: "natural-gas",
            dietType: "meat-average",
            foodWaste: "average",
            localFood: false,
            shoppingLevel: "average",
            recyclingHabits: "partial"
          },
          results: {
            transport: 0,
            energy: 0,
            food: 0,
            shopping: 0,
            total: 0
          },
          commitments: [],
          ecoPoints: 0,
          savedCO2: 0,
          unlockedBadges: []
        };
        // Reset form controls
        document.getElementById("footprint-form").reset();
        
        // Go back to step 0
        currentStep = 0;
        showStep(0);
        
        // Go to dashboard
        switchTab("dashboard");
        await saveState();
        updateUI();
      }
    });
  }
}

// Tab Switching Navigation
function setupNav() {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const tabId = item.getAttribute("data-tab");
      switchTab(tabId);
    });
  });

  // Switch tab buttons inside dashboards
  document.querySelectorAll(".btn-tab-switch").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      switchTab(target);
    });
  });
}

function switchTab(tabId) {
  // Update nav menu active states
  document.querySelectorAll(".nav-item").forEach(item => {
    if (item.getAttribute("data-tab") === tabId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Update tabs views
  document.querySelectorAll(".tab-content").forEach(content => {
    if (content.id === `tab-${tabId}`) {
      content.classList.add("active");
    } else {
      content.classList.remove("active");
    }
  });

  // Smooth scroll to top on tab switch
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Calculator Multi-Step form
let currentStep = 0;
function setupCalculator() {
  const btnPrev = document.getElementById("btn-calc-prev");
  const btnNext = document.getElementById("btn-calc-next");
  const btnFinish = document.getElementById("btn-calc-finish");

  btnNext.addEventListener("click", async () => {
    if (currentStep < 3) {
      // Save current input changes
      readInputs();
      await calculateCarbon();
      
      currentStep++;
      showStep(currentStep);
    }
  });

  btnPrev.addEventListener("click", async () => {
    if (currentStep > 0) {
      readInputs();
      await calculateCarbon();
      
      currentStep--;
      showStep(currentStep);
    }
  });

  btnFinish.addEventListener("click", async () => {
    readInputs();
    await calculateCarbon();
    state.isCalculated = true;
    
    // Unlock first calculation badge
    unlockBadge("first-calc");
    
    await saveState();
    updateUI();
    switchTab("dashboard");
  });

  // Add event listeners to input changes to recalculate running value
  const inputs = document.querySelectorAll("#footprint-form input, #footprint-form select");
  inputs.forEach(input => {
    input.addEventListener("input", async () => {
      readInputs();
      await calculateCarbon();
      document.getElementById("calc-running-val").textContent = state.results.total.toFixed(1);
    });
  });

  // Pre-fill fields with state
  prefillCalculator();
}

function showStep(stepIndex) {
  const steps = document.querySelectorAll(".calc-step");
  const stepItems = document.querySelectorAll(".step-nav-item");
  
  steps.forEach((step, idx) => {
    if (idx === stepIndex) {
      step.classList.add("active");
    } else {
      step.classList.remove("active");
    }
  });

  stepItems.forEach((item, idx) => {
    if (idx === stepIndex) {
      item.classList.add("active");
      item.classList.remove("completed");
    } else if (idx < stepIndex) {
      item.classList.add("completed");
      item.classList.remove("active");
    } else {
      item.classList.remove("active", "completed");
    }
  });

  // Button labels
  const btnPrev = document.getElementById("btn-calc-prev");
  const btnNext = document.getElementById("btn-calc-next");
  const btnFinish = document.getElementById("btn-calc-finish");

  if (stepIndex === 0) {
    btnPrev.disabled = true;
  } else {
    btnPrev.disabled = false;
  }

  if (stepIndex === 3) {
    btnNext.classList.add("d-none");
    btnFinish.classList.remove("d-none");
  } else {
    btnNext.classList.remove("d-none");
    btnFinish.classList.add("d-none");
  }
}

function prefillCalculator() {
  document.getElementById("car-miles").value = state.inputs.carMiles;
  document.getElementById("car-type").value = state.inputs.carType;
  document.getElementById("public-transit").value = state.inputs.publicTransit;
  document.getElementById("flight-hours").value = state.inputs.flightHours;
  
  document.getElementById("home-members").value = state.inputs.homeMembers;
  document.getElementById("electricity-bill").value = state.inputs.electricityBill;
  document.getElementById("clean-energy").checked = state.inputs.cleanEnergy;
  document.getElementById("heating-fuel").value = state.inputs.heatingFuel;
  
  document.getElementById("diet-type").value = state.inputs.dietType;
  document.getElementById("food-waste").value = state.inputs.foodWaste;
  document.getElementById("local-food").checked = state.inputs.localFood;
  
  document.getElementById("shopping-level").value = state.inputs.shoppingLevel;
  document.getElementById("recycling-habits").value = state.inputs.recyclingHabits;

  document.getElementById("calc-running-val").textContent = state.results.total.toFixed(1);
}

function readInputs() {
  state.inputs.carMiles = parseFloat(document.getElementById("car-miles").value) || 0;
  state.inputs.carType = document.getElementById("car-type").value;
  state.inputs.publicTransit = parseFloat(document.getElementById("public-transit").value) || 0;
  state.inputs.flightHours = parseFloat(document.getElementById("flight-hours").value) || 0;
  
  state.inputs.homeMembers = Math.max(1, parseInt(document.getElementById("home-members").value) || 1);
  state.inputs.electricityBill = parseFloat(document.getElementById("electricity-bill").value) || 0;
  state.inputs.cleanEnergy = document.getElementById("clean-energy").checked;
  state.inputs.heatingFuel = document.getElementById("heating-fuel").value;
  
  state.inputs.dietType = document.getElementById("diet-type").value;
  state.inputs.foodWaste = document.getElementById("food-waste").value;
  state.inputs.localFood = document.getElementById("local-food").checked;
  
  state.inputs.shoppingLevel = document.getElementById("shopping-level").value;
  state.inputs.recyclingHabits = document.getElementById("recycling-habits").value;
}

// Carbon Calculations (Hybrid client/server calculations)
async function calculateCarbon() {
  // 1. Run local calculation first (instant preview)
  runLocalCalculation();

  // 2. Query backend to verify and synchronize calculations
  if (isBackendOnline) {
    try {
      const res = await fetch(`${API_BASE}/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(state.inputs)
      });
      if (res.ok) {
        const serverResults = await res.json();
        state.results = serverResults;
        updateUI(); // Redraw metrics with server-verified numbers
      }
    } catch (e) {
      console.warn("Backend calculation query failed. Using local calculations.", e);
    }
  }
}

function runLocalCalculation() {
  // Transportation
  let transportCO2 = 0;
  if (state.inputs.carType !== "none") {
    let carFactor = 0.4;
    if (state.inputs.carType === "electric") carFactor = 0.1;
    if (state.inputs.carType === "hybrid") carFactor = 0.2;
    if (state.inputs.carType === "gas-large") carFactor = 0.52;
    transportCO2 += (state.inputs.carMiles * 52 * carFactor) / 1000;
  }
  transportCO2 += (state.inputs.publicTransit * 52 * 1.2) / 1000;
  transportCO2 += (state.inputs.flightHours * 90) / 1000;
  
  // Home Energy
  let energyCO2 = 0;
  let cleanGridFactor = state.inputs.cleanEnergy ? 0.05 : 0.38;
  energyCO2 += (state.inputs.electricityBill * 12 * cleanGridFactor);
  
  let heatFactor = 1200;
  if (state.inputs.heatingFuel === "electricity") heatFactor = 500;
  if (state.inputs.heatingFuel === "oil") heatFactor = 2200;
  if (state.inputs.heatingFuel === "none") heatFactor = 0;
  energyCO2 += heatFactor;
  energyCO2 = energyCO2 / state.inputs.homeMembers / 1000;

  // Diet
  let foodCO2 = 2.5;
  if (state.inputs.dietType === "meat-heavy") foodCO2 = 3.3;
  if (state.inputs.dietType === "pescatarian") foodCO2 = 1.7;
  if (state.inputs.dietType === "vegetarian") foodCO2 = 1.4;
  if (state.inputs.dietType === "vegan") foodCO2 = 0.9;
  
  if (state.inputs.localFood) foodCO2 *= 0.9;
  if (state.inputs.foodWaste === "low") foodCO2 *= 0.93;
  if (state.inputs.foodWaste === "high") foodCO2 *= 1.15;

  // Shopping
  let shoppingCO2 = 1.2;
  if (state.inputs.shoppingLevel === "minimalist") shoppingCO2 = 0.5;
  if (state.inputs.shoppingLevel === "heavy") shoppingCO2 = 2.4;
  
  if (state.inputs.recyclingHabits === "full") shoppingCO2 *= 0.85;
  if (state.inputs.recyclingHabits === "none") shoppingCO2 *= 1.05;

  state.results.transport = parseFloat(transportCO2.toFixed(2));
  state.results.energy = parseFloat(energyCO2.toFixed(2));
  state.results.food = parseFloat(foodCO2.toFixed(2));
  state.results.shopping = parseFloat(shoppingCO2.toFixed(2));
  state.results.total = parseFloat((transportCO2 + energyCO2 + foodCO2 + shoppingCO2).toFixed(2));
}

// Action Checklist and Commitments Management
function setupActionsPage() {
  const container = document.getElementById("actions-checklist");
  const filterBtns = document.querySelectorAll(".filter-btn");

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderActions(btn.getAttribute("data-filter"));
    });
  });

  renderActions("all");
}

function renderActions(filter = "all") {
  const container = document.getElementById("actions-checklist");
  if (!container) return;
  
  container.innerHTML = "";
  const filtered = ACTIONS_DATA.filter(action => filter === "all" || action.category === filter);

  filtered.forEach(action => {
    const isCompleted = state.commitments.includes(action.id);
    
    const actionCard = document.createElement("div");
    actionCard.className = `action-item ${isCompleted ? "completed-action" : ""}`;
    
    actionCard.innerHTML = `
      <label class="checkbox-label-container">
        <input type="checkbox" data-id="${action.id}" ${isCompleted ? "checked" : ""}>
        <span class="checkbox-custom"></span>
      </label>
      <div class="action-icon">
        <i data-lucide="${getCategoryIcon(action.category)}"></i>
      </div>
      <div class="action-info">
        <h4 class="action-title">${action.title}</h4>
        <p class="action-desc">${action.description}</p>
        <div class="action-stats">
          <span class="action-stat points-tag">+${action.points} Eco Pts</span>
          <span class="action-stat co2-tag">Saves ${action.co2Saved} kg CO₂ / yr</span>
          <span class="action-stat diff-tag text-muted">${action.category}</span>
        </div>
      </div>
    `;

    // Toggle commitment handler
    const checkbox = actionCard.querySelector("input[type='checkbox']");
    checkbox.addEventListener("change", async (e) => {
      await toggleCommitment(action.id, e.target.checked);
    });

    container.appendChild(actionCard);
  });
  
  lucide.createIcons();
}

function getCategoryIcon(cat) {
  if (cat === "easy") return "zap";
  if (cat === "medium") return "heart";
  return "flame";
}

async function toggleCommitment(actionId, isChecked) {
  const action = ACTIONS_DATA.find(a => a.id === actionId);
  if (!action) return;

  if (isChecked) {
    if (!state.commitments.includes(actionId)) {
      state.commitments.push(actionId);
    }
  } else {
    state.commitments = state.commitments.filter(id => id !== actionId);
  }

  // Recalculate savings and points
  calculateReductions();
  
  // Check badge unlocks based on new states
  checkBadgeMilestones();

  await saveState();
  updateUI();
  
  // Rerender active filter list to update card classes (background changes)
  const activeFilter = document.querySelector(".filter-btn.active").getAttribute("data-filter");
  renderActions(activeFilter);
}

function calculateReductions() {
  let points = 0;
  let co2 = 0;

  state.commitments.forEach(actionId => {
    const action = ACTIONS_DATA.find(a => a.id === actionId);
    if (action) {
      points += action.points;
      co2 += action.co2Saved;
    }
  });

  state.ecoPoints = points;
  state.savedCO2 = co2;
}

// Badge Unlocking & Logic
function unlockBadge(badgeId) {
  if (!state.unlockedBadges.includes(badgeId)) {
    state.unlockedBadges.push(badgeId);
    
    const badge = BADGES_DATA.find(b => b.id === badgeId);
    if (badge) {
      triggerBadgeNotification(badge);
    }
  }
}

function checkBadgeMilestones() {
  if (state.isCalculated) unlockBadge("first-calc");
  if (state.commitments.length >= 3) unlockBadge("green-advocate");
  if (state.ecoPoints >= 100) unlockBadge("points-100");
  if (state.savedCO2 >= 500) unlockBadge("carbon-cutter");
  if (state.savedCO2 >= 1500) unlockBadge("planet-saver");
}

function triggerBadgeNotification(badge) {
  const toast = document.createElement("div");
  toast.className = "badge-toast";
  toast.innerHTML = `
    <div class="toast-badge-icon"><i data-lucide="award"></i></div>
    <div class="toast-badge-content">
      <div class="toast-title">Achievement Unlocked!</div>
      <div class="toast-badge-name">${badge.title}</div>
    </div>
  `;
  document.body.appendChild(toast);
  lucide.createIcons();
  
  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// Dynamic UI Rendering
function updateUI() {
  const isSetup = state.isCalculated;
  
  const totalVal = document.getElementById("dash-total-val");
  const compText = document.getElementById("dash-comparison-text");
  const runningVal = document.getElementById("calc-running-val");
  
  const treesMetric = document.getElementById("mm-trees");
  const savingsMetric = document.getElementById("mm-savings");
  
  document.getElementById("sidebar-saved-val").textContent = `${state.savedCO2} kg`;
  
  const level = Math.floor(state.ecoPoints / 50) + 1;
  document.getElementById("user-level").textContent = level;
  
  const levelProgress = (state.ecoPoints % 50) * 2;
  document.getElementById("sidebar-progress-fill").style.width = `${levelProgress}%`;

  document.getElementById("badge-count-text").textContent = `${state.unlockedBadges.length} Badge${state.unlockedBadges.length === 1 ? '' : 's'}`;

  document.getElementById("active-commitments-count").textContent = state.commitments.length;
  document.getElementById("annualized-savings-count").textContent = `${state.savedCO2} kg CO₂`;
  document.getElementById("eco-points-val").textContent = `${state.ecoPoints} pts`;

  renderCommitmentsSidebar();
  renderBadgesTab();

  if (isSetup) {
    const currentFootprint = Math.max(0, state.results.total - (state.savedCO2 / 1000));
    totalVal.textContent = currentFootprint.toFixed(1);
    runningVal.textContent = state.results.total.toFixed(1);
    
    const treesNeeded = Math.ceil((currentFootprint * 1000) / 22);
    treesMetric.textContent = treesNeeded;
    
    savingsMetric.textContent = `${state.savedCO2} kg`;
    
    let comparisonText = "";
    if (currentFootprint <= 2.0) {
      comparisonText = `<span class="icon-green font-bold">Excellent!</span> You're meeting the global climate target of under 2 tonnes/year!`;
    } else if (currentFootprint <= 6.0) {
      comparisonText = `<span class="icon-cyan font-bold">Good Job!</span> You are below the average developed nation footprint (~8 tonnes).`;
    } else {
      const percentageAboveTarget = Math.round(((currentFootprint - 2) / 2) * 100);
      comparisonText = `You are <span class="text-orange font-bold">${percentageAboveTarget}%</span> above the global climate target of 2.0 tonnes.`;
    }
    compText.innerHTML = comparisonText;
    
    updateChart();
    generateRecommendations();
    generateInsightsText(currentFootprint);
  } else {
    totalVal.textContent = "0.0";
    compText.innerHTML = `Please complete the <a href="#calculator" class="btn-tab-switch underline-green" data-target="calculator">Footprint Calculator</a> first.`;
    treesMetric.textContent = "0";
    savingsMetric.textContent = "0 kg";
    
    document.getElementById("quick-recs-list").innerHTML = `
      <div class="rec-item">
        <span>No recommendations yet. Complete calculation first!</span>
      </div>
    `;
    
    drawEmptyChart();
  }

  // Bind tab links dynamically inside dynamically generated elements
  document.querySelectorAll(".btn-tab-switch").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      switchTab(target);
    });
  });
}

function renderCommitmentsSidebar() {
  const container = document.getElementById("commitments-list");
  if (!container) return;

  if (state.commitments.length === 0) {
    container.innerHTML = `
      <div class="commitment-empty">
        <i data-lucide="target" class="text-muted"></i>
        <p>No active commitments yet. Check actions on the left to commit to reducing your carbon footprint!</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = "";
  state.commitments.forEach(actionId => {
    const action = ACTIONS_DATA.find(a => a.id === actionId);
    if (action) {
      const div = document.createElement("div");
      div.className = "commitment-card";
      div.innerHTML = `
        <i data-lucide="check-circle-2"></i>
        <div>
          <span>${action.title}</span>
          <div style="font-size:0.75rem; color:var(--color-text-muted)">-${action.co2Saved} kg CO₂ / yr</div>
        </div>
      `;
      container.appendChild(div);
    }
  });
  lucide.createIcons();
}

function renderBadgesTab() {
  const container = document.getElementById("badges-container");
  if (!container) return;

  container.innerHTML = "";
  BADGES_DATA.forEach(badge => {
    const isUnlocked = state.unlockedBadges.includes(badge.id);
    const div = document.createElement("div");
    div.className = `badge-card ${isUnlocked ? 'unlocked' : 'locked'}`;
    
    let iconName = badge.icon;
    if (!isUnlocked) iconName = "lock";
    
    div.innerHTML = `
      <div class="badge-icon-wrap">
        <i data-lucide="${iconName}"></i>
      </div>
      <h4>${badge.title}</h4>
      <p>${badge.description}</p>
      <span class="badge-status-tag">${isUnlocked ? 'Unlocked' : badge.requirementText}</span>
    `;
    container.appendChild(div);
  });
}

function generateRecommendations() {
  const listContainer = document.getElementById("quick-recs-list");
  if (!listContainer) return;

  listContainer.innerHTML = "";

  const uncommitted = ACTIONS_DATA.filter(a => !state.commitments.includes(a.id));
  
  let sectors = [
    { name: "transport", val: state.results.transport },
    { name: "energy", val: state.results.energy },
    { name: "food", val: state.results.food },
    { name: "shopping", val: state.results.shopping }
  ];
  sectors.sort((a, b) => b.val - a.val);
  const primarySector = sectors[0].name;

  let recs = [];
  if (primarySector === "transport") {
    recs = uncommitted.filter(a => ["commute-bike", "upgrade-ev"].includes(a.id));
  } else if (primarySector === "energy") {
    recs = uncommitted.filter(a => ["solar-panels", "heat-pump", "switch-led", "smart-thermostat"].includes(a.id));
  } else if (primarySector === "food") {
    recs = uncommitted.filter(a => ["meat-free-monday", "compost-waste"].includes(a.id));
  }
  
  if (recs.length < 3) {
    const ids = recs.map(r => r.id);
    const backfill = uncommitted
      .filter(a => !ids.includes(a.id))
      .sort((a, b) => b.co2Saved - a.co2Saved);
    recs = [...recs, ...backfill].slice(0, 3);
  }

  recs.forEach(rec => {
    const div = document.createElement("div");
    div.className = "rec-item";
    div.innerHTML = `
      <span class="rec-item-title">${rec.title}</span>
      <div style="display:flex; align-items:center; gap:0.5rem">
        <span class="rec-item-savings">-${rec.co2Saved} kg CO₂</span>
        <button class="btn btn-secondary btn-icon btn-add-rec" data-id="${rec.id}" style="padding:4px 8px; font-size:0.75rem">
          <i data-lucide="plus"></i>
        </button>
      </div>
    `;

    div.querySelector(".btn-add-rec").addEventListener("click", async () => {
      await toggleCommitment(rec.id, true);
    });

    listContainer.appendChild(div);
  });
  
  lucide.createIcons();
}

function generateInsightsText(currentFootprint) {
  const container = document.getElementById("insights-container");
  if (!container) return;

  container.innerHTML = "";

  const transportVal = state.results.transport;
  const energyVal = state.results.energy;
  const foodVal = state.results.food;
  const shoppingVal = state.results.shopping;
  const total = state.results.total;

  let insightsHtml = "";

  if (currentFootprint > 12) {
    insightsHtml += `
      <div class="insight-item warning">
        <i data-lucide="alert-triangle" class="icon-orange"></i>
        <div>
          <h4>High Emissions Alert</h4>
          <p>Your footprint is ${currentFootprint.toFixed(1)} tonnes, significantly higher than the global target of 2.0 tonnes. Committing to a few lifestyle shifts in your largest emission categories can quickly bring this down.</p>
        </div>
      </div>
    `;
  } else if (currentFootprint <= 2.0) {
    insightsHtml += `
      <div class="insight-item success">
        <i data-lucide="sparkles" class="icon-green"></i>
        <div>
          <h4>Climate Superhero Status</h4>
          <p>Sensational! Your emissions are meeting the global target required to avoid major heating. Keep showing others how simple it is to lead a low-carbon lifestyle.</p>
        </div>
      </div>
    `;
  }

  if (transportVal / total > 0.35 && transportVal > 3.0) {
    insightsHtml += `
      <div class="insight-item">
        <i data-lucide="car" class="icon-cyan"></i>
        <div>
          <h4>Transportation is your biggest source</h4>
          <p>Driving and flying contribute ${Math.round((transportVal/total)*100)}% of your footprint. Walking, cycling, or transit for shorter commutes, or switching to hybrid/electric vehicles, offers the fastest reduction.</p>
        </div>
      </div>
    `;
  }

  if (energyVal > 2.5) {
    insightsHtml += `
      <div class="insight-item">
        <i data-lucide="home" class="icon-cyan"></i>
        <div>
          <h4>Heavy Home Utility Footprint</h4>
          <p>Your home energy emissions are high. Switching to a green energy utility provider or upgrading heating components (like electric heat pumps) can eliminate thousands of kg of carbon emissions annually.</p>
        </div>
      </div>
    `;
  }

  if (state.inputs.dietType === "meat-heavy") {
    insightsHtml += `
      <div class="insight-item">
        <i data-lucide="utensils" class="icon-cyan"></i>
        <div>
          <h4>Dietary Carbon Savings Opportunity</h4>
          <p>Red meat has an outsized carbon footprint. Simply moving to an average diet or joining 'Meat-Free Mondays' could shave over 800 kg of carbon from your score this year.</p>
        </div>
      </div>
    `;
  }

  if (state.inputs.cleanEnergy) {
    insightsHtml += `
      <div class="insight-item success">
        <i data-lucide="check" class="icon-green"></i>
        <div>
          <h4>Green Grid Champion</h4>
          <p>Excellent! Powering your home with 100% renewable energy saves you over 2,000 kg of carbon dioxide equivalent emissions compared to fossil fuels.</p>
        </div>
      </div>
    `;
  }

  if (insightsHtml === "") {
    insightsHtml = `
      <div class="insight-item success">
        <i data-lucide="smile" class="icon-green"></i>
        <div>
          <h4>Carbon Balanced</h4>
          <p>Your carbon metrics look well-balanced across energy, transport, food, and consumption. Continue reviewing our actions checklist to trim down further towards net zero.</p>
        </div>
      </div>
    `;
  }

  container.innerHTML = insightsHtml;
  lucide.createIcons();
}

function drawEmptyChart() {
  const ctx = document.getElementById("footprintChart");
  if (!ctx) return;

  if (footprintChartInstance) {
    footprintChartInstance.destroy();
  }

  footprintChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Complete Calculator first'],
      datasets: [{
        data: [1],
        backgroundColor: ['rgba(255, 255, 255, 0.05)'],
        borderColor: ['rgba(255, 255, 255, 0.1)'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: '#9ca3af'
          }
        }
      }
    }
  });
}

function updateChart() {
  const ctx = document.getElementById("footprintChart");
  if (!ctx) return;

  const data = [
    state.results.transport,
    state.results.energy,
    state.results.food,
    state.results.shopping
  ];

  let transportReduction = 0;
  let energyReduction = 0;
  let foodReduction = 0;
  let shoppingReduction = 0;

  state.commitments.forEach(actionId => {
    const action = ACTIONS_DATA.find(a => a.id === actionId);
    if (action) {
      if (actionId === "upgrade-ev" || actionId === "commute-bike") {
        transportReduction += action.co2Saved;
      } else if (actionId === "solar-panels" || actionId === "heat-pump" || actionId === "switch-led" || actionId === "unplug-standby" || actionId === "wash-cold" || actionId === "smart-thermostat" || actionId === "dry-line") {
        energyReduction += action.co2Saved;
      } else if (actionId === "meat-free-monday" || actionId === "compost-waste") {
        foodReduction += action.co2Saved;
      } else {
        shoppingReduction += action.co2Saved;
      }
    }
  });

  const chartTransportVal = Math.max(0, state.results.transport - (transportReduction / 1000));
  const chartEnergyVal = Math.max(0, state.results.energy - (energyReduction / 1000));
  const chartFoodVal = Math.max(0, state.results.food - (foodReduction / 1000));
  const chartShoppingVal = Math.max(0, state.results.shopping - (shoppingReduction / 1000));

  if (footprintChartInstance) {
    footprintChartInstance.destroy();
  }

  footprintChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Transport', 'Home Energy', 'Food & Diet', 'Shopping & Waste'],
      datasets: [{
        data: [chartTransportVal, chartEnergyVal, chartFoodVal, chartShoppingVal],
        backgroundColor: [
          'rgba(6, 182, 212, 0.75)',
          'rgba(59, 130, 246, 0.75)',
          'rgba(16, 185, 129, 0.75)',
          'rgba(245, 158, 11, 0.75)'
        ],
        borderColor: [
          '#06b6d4',
          '#3b82f6',
          '#10b981',
          '#f59e0b'
        ],
        borderWidth: 1.5,
        hoverOffset: 12
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: '#f3f4f6',
            font: {
              family: 'Inter',
              size: 11
            },
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const totalVal = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = totalVal > 0 ? Math.round((value / totalVal) * 100) : 0;
              return ` ${context.label}: ${value.toFixed(2)} t CO₂e (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// Add Floating CSS dynamically for Achievement Unlocks
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  .badge-toast {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: rgba(17, 24, 39, 0.95);
    border: 1px solid rgba(245, 158, 11, 0.4);
    box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.25), 0 0 15px rgba(245, 158, 11, 0.1);
    border-radius: 12px;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    z-index: 999;
    transform: translateY(100px);
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  .badge-toast.show {
    transform: translateY(0);
    opacity: 1;
  }
  .toast-badge-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(245, 158, 11, 0.15);
    color: var(--accent-gold);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .toast-title {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: var(--color-text-muted);
    font-weight: 700;
    letter-spacing: 0.05em;
  }
  .toast-badge-name {
    font-family: var(--font-heading);
    font-size: 1.05rem;
    font-weight: 700;
    color: white;
  }
  .underline-green {
    text-decoration-color: var(--primary) !important;
  }
  .font-bold {
    font-weight: 700;
  }
  .text-orange {
    color: var(--accent-gold);
  }
`;
document.head.appendChild(styleSheet);
