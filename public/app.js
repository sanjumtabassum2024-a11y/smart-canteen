$(document).ready(function () {
    "use strict";

    // ========================================
    // SMARTBITE FRONTEND
    // ========================================

    const API = "/api";
    let foods = [];
    let cart = [];
    let activeCategory = "All";

    const currency = (amount) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR"
        }).format(Number(amount) || 0);

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char];
        });
    }

    function showMessage(message, type = "info") {
        const colors = {
            success: "#16845b",
            error: "#bd3c32",
            info: "#315fbb"
        };

        const $notice = $(`
            <div role="status" style="
                position:fixed;
                z-index:2000;
                right:20px;
                bottom:20px;
                max-width:calc(100% - 40px);
                padding:14px 18px;
                color:white;
                background:${colors[type] || colors.info};
                border-radius:12px;
                box-shadow:0 8px 25px rgba(0,0,0,.15);
                font-size:14px;
            "></div>
        `);

        $notice.text(message);
        $("body").append($notice);

        setTimeout(function () {
            $notice.fadeOut(250, function () {
                $(this).remove();
            });
        }, 3200);
    }

    async function apiRequest(path, options = {}) {
        const response = await fetch(API + path, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || data.error || "Request failed.");
        }

        return data;
    }

    // ========================================
    // FOOD MENU
    // ========================================

    function getFoodCategory(food) {
        return food.category || food.type || "Meals";
    }

    function getFoodImage(food) {
        return food.image || food.imageUrl ||
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80";
    }

    function isAvailable(food) {
        return food.available !== false && food.isAvailable !== false;
    }

    function renderFoods() {
        const search = $("#searchInput").val().trim().toLowerCase();

        const filteredFoods = foods.filter(function (food) {
            const name = String(food.name || "").toLowerCase();
            const description = String(food.description || "").toLowerCase();
            const category = getFoodCategory(food);

            const matchesSearch =
                name.includes(search) || description.includes(search);

            const matchesCategory =
                activeCategory === "All" ||
                category.toLowerCase() === activeCategory.toLowerCase();

            return matchesSearch && matchesCategory;
        });

        if (filteredFoods.length === 0) {
            $("#foodContainer").html(`
                <div class="col-12">
                    <div class="empty-menu">
                        <i class="bi bi-search"></i>
                        <h3>No food items found</h3>
                        <p>Try a different search or category.</p>
                    </div>
                </div>
            `);
            return;
        }

        const html = filteredFoods.map(function (food) {
            const id = escapeHTML(food._id);
            const name = escapeHTML(food.name || "Food item");
            const description = escapeHTML(food.description || "Freshly prepared at our canteen.");
            const category = escapeHTML(getFoodCategory(food));
            const image = escapeHTML(getFoodImage(food));
            const price = Number(food.price) || 0;
            const available = isAvailable(food);

            return `
                <div class="col-6 col-md-4 col-xl-3">
                    <article class="food-card">
                        <img
                            src="${image}"
                            alt="${name}"
                            loading="lazy"
                            onerror="this.onerror=null;this.src='https://placehold.co/600x400/f0f5f0/16845b?text=SmartBite'">

                        <div class="food-card-body">
                            <span class="food-category">${category}</span>
                            <h3>${name}</h3>
                            <p>${description}</p>

                            <div class="food-card-footer">
                                <span class="food-price">${currency(price)}</span>

                                ${
                                    available
                                    ? `<button class="add-to-cart" data-add="${id}">
                                        <i class="bi bi-plus-lg"></i> Add
                                      </button>`
                                    : `<span class="food-unavailable">Unavailable</span>`
                                }
                            </div>
                        </div>
                    </article>
                </div>
            `;
        }).join("");

        $("#foodContainer").html(html);
    }

    async function loadFoods() {
        $("#foodContainer").html(`
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-success" role="status"></div>
                <p class="mt-3">Loading today's menu...</p>
            </div>
        `);

        try {
            const data = await apiRequest("/foods");
            console.log("Foods API response:", data);
            foods = Array.isArray(data) ? data : (data.foods || data.items || []);
            console.log("Foods loaded:", foods.length, foods);
            renderFoods();
            console.log("Menu rendered successfully");

        } catch (error) {
            console.error("Could not load foods:", error);

            $("#foodContainer").html(`
                <div class="col-12">
                    <div class="empty-menu">
                        <i class="bi bi-exclamation-circle"></i>
                        <h3>Couldn't load the menu</h3>
                        <p>Make sure your Node.js server and MongoDB are running.</p>
                        <button class="btn primary-button mt-3" id="retryFoods">
                            <i class="bi bi-arrow-clockwise"></i> Try again
                        </button>
                    </div>
                </div>
            `);
        }
    }

    $("#retryFoods").on("click", loadFoods);

    $("#searchInput").on("input", renderFoods);

    $("#categoryList").on("click", ".category-button", function () {
        activeCategory = $(this).data("category");

        $("#categoryList .category-button").removeClass("active");
        $(this).addClass("active");

        renderFoods();
    });

    // ========================================
    // SHOPPING CART
    // ========================================

    function getCartItem(id) {
        return cart.find(function (item) {
            return String(item.id) === String(id);
        });
    }

    function cartTotal() {
        return cart.reduce(function (total, item) {
            return total + item.price * item.quantity;
        }, 0);
    }

    function renderCart() {
        const totalItems = cart.reduce(function (sum, item) {
            return sum + item.quantity;
        }, 0);

        $("#cartCount").text(totalItems);
        $("#cartTotal").text(currency(cartTotal()));
        $("#checkoutTotal").text(currency(cartTotal()));
        $("#checkoutButton").prop("disabled", cart.length === 0);

        if (cart.length === 0) {
            $("#cartItems").html(`
                <div class="empty-cart">
                    <i class="bi bi-bag"></i>
                    <h3>Your cart is empty</h3>
                    <p>Add something delicious from the menu.</p>
                </div>
            `);
            return;
        }

        const html = cart.map(function (item) {
            return `
                <div class="cart-item">
                    <img
                        class="cart-item-image"
                        src="${escapeHTML(item.image)}"
                        alt="${escapeHTML(item.name)}"
                        onerror="this.onerror=null;this.src='https://placehold.co/200x200/f0f5f0/16845b?text=Food'">

                    <div class="cart-item-details">
                        <h3>${escapeHTML(item.name)}</h3>
                        <p>${currency(item.price * item.quantity)}</p>

                        <div class="quantity-controls">
                            <button type="button" data-decrease="${escapeHTML(item.id)}" aria-label="Decrease quantity">−</button>
                            <span>${item.quantity}</span>
                            <button type="button" data-increase="${escapeHTML(item.id)}" aria-label="Increase quantity">+</button>
                        </div>
                    </div>

                    <button type="button"
                        class="remove-cart-item"
                        data-remove="${escapeHTML(item.id)}"
                        aria-label="Remove ${escapeHTML(item.name)}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
        }).join("");

        $("#cartItems").html(html);
    }

    function addToCart(id) {
        const food = foods.find(function (item) {
            return String(item._id) === String(id);
        });

        if (!food || !isAvailable(food)) {
            showMessage("This item is currently unavailable.", "error");
            return;
        }

        const existing = getCartItem(id);

        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                id: String(food._id),
                name: food.name,
                price: Number(food.price) || 0,
                image: getFoodImage(food),
                quantity: 1
            });
        }

        renderCart();
        showMessage(food.name + " added to your cart.", "success");
    }

    $("#foodContainer").on("click", "[data-add]", function () {
        addToCart($(this).attr("data-add"));
    });

    $("#cartItems").on("click", "[data-increase]", function () {
        const item = getCartItem($(this).attr("data-increase"));
        if (item) item.quantity += 1;
        renderCart();
    });

    $("#cartItems").on("click", "[data-decrease]", function () {
        const item = getCartItem($(this).attr("data-decrease"));

        if (item) {
            item.quantity -= 1;

            if (item.quantity <= 0) {
                cart = cart.filter(function (cartItem) {
                    return cartItem.id !== item.id;
                });
            }
        }

        renderCart();
    });

    $("#cartItems").on("click", "[data-remove]", function () {
        const id = $(this).attr("data-remove");

        cart = cart.filter(function (item) {
            return item.id !== id;
        });

        renderCart();
    });

    function openCart() {
        $("#cartDrawer").addClass("open");
        $("#cartOverlay").addClass("open");
        $("body").css("overflow", "hidden");
    }

    function closeCart() {
        $("#cartDrawer").removeClass("open");
        $("#cartOverlay").removeClass("open");
        $("body").css("overflow", "");
    }

    $("#cartButton").on("click", openCart);
    $("#closeCart, #cartOverlay").on("click", closeCart);

    $(document).on("keydown", function (event) {
        if (event.key === "Escape") {
            closeCart();
        }
    });

    // ========================================
    // CHECKOUT AND ORDER PLACEMENT
    // ========================================

    $("#checkoutButton").on("click", function () {
        if (cart.length === 0) return;

        $("#checkoutTotal").text(currency(cartTotal()));
        closeCart();

        const modal = bootstrap.Modal.getOrCreateInstance(
            document.getElementById("checkoutModal")
        );

        modal.show();
    });

    $("#checkoutForm").on("submit", async function (event) {
        event.preventDefault();

        if (cart.length === 0) {
            showMessage("Your cart is empty.", "error");
            return;
        }

        const $button = $("#placeOrderButton");
        const originalButton = $button.html();

        const payload = {
            customerName: $("#customerName").val().trim(),
            customerEmail: $("#customerEmail").val().trim(),
            customerPhone: $("#customerPhone").val().trim(),
            items: cart.map(function (item) {
                return {
                    foodId: item.id,
                    quantity: item.quantity
                };
            }),
            paymentMethod: $("#paymentMethod").val()
        };

        if (!payload.customerName || !payload.customerEmail || !payload.customerPhone) {
            showMessage("Please complete all checkout fields.", "error");
            return;
        }

        $button.prop("disabled", true).text("Placing order...");

        try {
            const result = await apiRequest("/orders", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            const order = result.order || result;
            const orderId = order._id || order.orderId || order.id;

            cart = [];
            renderCart();
            $("#checkoutForm")[0].reset();

            bootstrap.Modal.getOrCreateInstance(
                document.getElementById("checkoutModal")
            ).hide();

            if (orderId) {
                $("#orderIdInput").val(orderId);
                $("#trackResult").html(`
                    <div class="alert alert-success mt-3 mb-0">
                        <strong>Order placed successfully!</strong><br>
                        Your order ID is
                        <code>${escapeHTML(orderId)}</code>.
                        Save it to track your order.
                    </div>
                `);
            }

            showMessage("Your order has been placed!", "success");
        } catch (error) {
            console.error("Order placement failed:", error);
            showMessage(error.message || "Could not place your order.", "error");
        } finally {
            $button.prop("disabled", false).html(originalButton);
        }
    });

    // ========================================
    // ORDER TRACKING
    // ========================================

    $("#trackForm").on("submit", async function (event) {
        event.preventDefault();

        const orderId = $("#orderIdInput").val().trim();

        if (!orderId) {
            showMessage("Please enter your order ID.", "error");
            return;
        }

        $("#trackResult").text("Checking your order...");

        try {
            const result = await apiRequest("/orders/" + encodeURIComponent(orderId));
            const order = result.order || result;

            const status = order.status || order.orderStatus || "Pending";
            const total = order.totalAmount ?? order.total ?? order.totalPrice;

            $("#trackResult").html(`
                <div class="alert alert-light border mt-3 mb-0">
                    <p class="mb-2"><strong>Order:</strong> ${escapeHTML(order._id || orderId)}</p>
                    <p class="mb-2"><strong>Status:</strong>
                        <span class="status-badge">${escapeHTML(status)}</span>
                    </p>
                    ${total !== undefined ? `<p class="mb-0"><strong>Total:</strong> ${currency(total)}</p>` : ""}
                </div>
            `);
        } catch (error) {
            console.error("Order tracking failed:", error);

            $("#trackResult").html(`
                <div class="alert alert-warning mt-3 mb-0">
                    Could not find this order. Please check the ID and try again.
                </div>
            `);
        }
    });

    // ========================================
    // INITIALIZE
    // ========================================

    renderCart();
    loadFoods();
});