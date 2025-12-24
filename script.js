// --- ESTADO GLOBAL ---
let allProducts = [];
let filteredProducts = [];
let isGridView = true;
let isDark = localStorage.getItem("theme") === "dark";
let activeCategory = "Todos";

const dom = {
    html: document.documentElement,
    themeToggle: document.getElementById("themeToggle"),
    layoutToggle: document.getElementById("layoutToggle"),
    iconSun: document.getElementById("iconSun"),
    iconMoon: document.getElementById("iconMoon"),
    iconGrid: document.getElementById("iconGrid"),
    iconList: document.getElementById("iconList"),
    productsContainer: document.getElementById("products"),
    categoryContainer: document.getElementById("categoryContainer"),
    loader: document.getElementById("loader"),
    errorMsg: document.getElementById("errorMessage"),
    searchInput: document.getElementById("searchInput"),
    sortSelect: document.getElementById("sortSelect"),
};

// --- INICIALIZAÇÃO ---
async function init() {
    applyTheme();
    setupEventListeners();
    await fetchProducts();
}

function setupEventListeners() {
    dom.themeToggle.addEventListener("click", toggleTheme);
    dom.layoutToggle.addEventListener("click", toggleLayout);
    dom.searchInput.addEventListener("input", (e) =>
        filterAndRender(e.target.value, dom.sortSelect.value)
    );
    dom.sortSelect.addEventListener("change", (e) =>
        filterAndRender(dom.searchInput.value, e.target.value)
    );
}

async function fetchProducts() {
    showLoading(true);
    try {
        const response = await fetch("produtos.json");
        if (!response.ok) throw new Error("Erro ao carregar");
        const data = await response.json();
        
        // Armazena e inverte para que os novos (últimos do JSON) apareçam primeiro por padrão
        allProducts = data.reverse(); 
        
        filteredProducts = [...allProducts];
        generateCategories(allProducts);
        renderProducts();
    } catch (error) {
        dom.errorMsg.classList.remove("hidden");
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    dom.loader.classList.toggle("hidden", !show);
    dom.loader.classList.toggle("flex", show);
    dom.productsContainer.classList.toggle("hidden", show);
}

// --- FILTRO E ORDENAÇÃO ---
function filterAndRender(searchTerm = "", sortType = "default") {
    let temp = [...allProducts];

    // 1. Filtro por Categoria
    if (activeCategory !== "Todos") {
        temp = temp.filter((p) => p.category === activeCategory);
    }

    // 2. Filtro por busca
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase().trim();
        temp = temp.filter(
            (p) =>
                p.title.toLowerCase().includes(lowerTerm) ||
                (p.code && p.code.toString().toLowerCase().includes(lowerTerm))
        );
    }

    // 3. Ordenação
    if (sortType === "price-asc") {
        temp.sort((a, b) => a.price - b.price);
    } 
    else if (sortType === "price-desc") {
        temp.sort((a, b) => b.price - a.price);
    } 
    else if (sortType === "store-shopee") {
        temp.sort((a, b) => {
            const storeA = a.store.toLowerCase();
            const storeB = b.store.toLowerCase();
            if (storeA === "shopee" && storeB !== "shopee") return -1;
            if (storeA !== "shopee" && storeB === "shopee") return 1;
            return 0;
        });
    } 
    else if (sortType === "store-ml") {
        temp.sort((a, b) => {
            const storeA = a.store.toLowerCase();
            const storeB = b.store.toLowerCase();
            const isMLA = storeA.includes("mercado") || storeA.includes("ml");
            const isMLB = storeB.includes("mercado") || storeB.includes("ml");
            if (isMLA && !isMLB) return -1;
            if (!isMLA && isMLB) return 1;
            return 0;
        });
    }
    // Se for "default", ele já está invertido pelo fetchProducts()

    filteredProducts = temp;
    renderProducts();
}

function generateCategories(data) {
    // Usamos um Set para pegar categorias únicas, mas mantemos o "Todos"
    const cats = ["Todos", ...new Set(data.map((p) => p.category))];
    dom.categoryContainer.innerHTML = cats
        .map(
            (cat) => `
                <button onclick="filterByCategory('${cat}')" 
                    class="cat-btn flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition border 
                    ${
                        cat === "Todos"
                            ? "bg-brand-600 text-white shadow-md border-transparent"
                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                    }">
                    ${cat}
                </button>
            `
        )
        .join("");
}

function filterByCategory(category) {
    activeCategory = category;
    document.querySelectorAll(".cat-btn").forEach((btn) => {
        const isActive = btn.innerText.trim() === category;
        btn.className = `cat-btn flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition border ${
            isActive
                ? "bg-brand-600 text-white shadow-md border-transparent"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
        }`;
    });
    filterAndRender(dom.searchInput.value, dom.sortSelect.value);
}

function copyCode(event, code) {
    event.preventDefault();
    event.stopPropagation();
    navigator.clipboard.writeText(code).then(() => {
        const btn = event.currentTarget;
        const feedback = btn.querySelector(".copy-feedback");
        feedback.classList.add("show");
        setTimeout(() => feedback.classList.remove("show"), 1500);
    });
}

function renderProducts() {
    dom.productsContainer.innerHTML = filteredProducts
        .map((product) => {
            const discount = product.oldPrice
                ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
                : 0;
            const productCode = product.code || "";

            return `
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex ${
                    isGridView ? "flex-col" : "gap-4 p-3"
                } group hover:shadow-lg transition-all relative">
                    <a href="${product.link}" target="_blank" class="${
                isGridView ? "w-full" : "w-28 h-28 flex-shrink-0"
            } relative overflow-hidden bg-gray-100 rounded-t-2xl ${
                !isGridView ? "rounded-xl" : ""
            }">
                        <img src="${product.image}" loading="lazy" alt="${
                product.title
            }" class="object-cover w-full h-full group-hover:scale-110 transition duration-500" />
                        ${
                            discount > 0
                                ? `<span class="absolute top-2 right-2 bg-brand-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm z-10">-${discount}%</span>`
                                : ""
                        }
                    </a>
                    
                    <div class="${isGridView ? "p-3" : "flex-1 py-1"} flex flex-col">
                        <div class="flex justify-between items-start mb-1">
                            <span class="text-[10px] text-gray-500 uppercase font-semibold">${product.store}</span>
                            ${
                                productCode
                                    ? `
                                <button onclick="copyCode(event, '${productCode}')" class="relative group/copy flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[9px] font-bold text-gray-500 dark:text-gray-400 hover:bg-brand-50 hover:text-brand-600 transition">
                                    ID: ${productCode}
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                </button>`
                                    : ""
                            }
                        </div>

                        <a href="${product.link}" target="_blank" class="block flex-1">
                            <h3 class="text-sm font-medium text-gray-800 dark:text-gray-100 leading-tight mb-2 line-clamp-2">${product.title}</h3>
                            <div class="mt-auto">
                                ${
                                    product.oldPrice
                                        ? `<p class="text-xs text-gray-400 line-through">R$ ${product.oldPrice.toFixed(2).replace(".", ",")}</p>`
                                        : '<div class="h-4"></div>'
                                }
                                <div class="flex items-center justify-between mt-1">
                                    <p class="text-lg font-bold text-brand-600 dark:text-brand-500">R$ ${product.price.toFixed(2).replace(".", ",")}</p>
                                    <div class="bg-brand-600 text-white p-1.5 rounded-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>`;
        })
        .join("");
}

// --- TEMAS & LAYOUT ---
function toggleTheme() {
    isDark = !isDark;
    localStorage.setItem("theme", isDark ? "dark" : "light");
    applyTheme();
}
function applyTheme() {
    dom.html.classList.toggle("dark", isDark);
    dom.iconMoon.classList.toggle("hidden", isDark);
    dom.iconSun.classList.toggle("hidden", !isDark);
}
function toggleLayout() {
    isGridView = !isGridView;
    dom.iconGrid.classList.toggle("hidden", !isGridView);
    dom.iconList.classList.toggle("hidden", isGridView);
    dom.productsContainer.className = isGridView
        ? "grid grid-cols-2 gap-4 pb-10 min-h-[300px]"
        : "grid grid-cols-1 gap-4 pb-10 min-h-[300px]";
    renderProducts();
}

init();