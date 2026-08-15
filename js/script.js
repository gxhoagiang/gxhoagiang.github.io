document.addEventListener("DOMContentLoaded", function () {
  // 1. Tự động Load Header (Từ file components/header.html)
  const headerPlaceholder = document.getElementById("header-placeholder");
  if (headerPlaceholder) {
    fetch("components/header.html")
      .then((response) => {
        if (!response.ok) throw new Error("Không thể nạp header");
        return response.text();
      })
      .then((data) => {
        headerPlaceholder.innerHTML = data;

        // Highlight Menu theo trang hiện tại
        const currentPage =
          window.location.pathname.split("/").pop() || "index.html";
        const navLinks = document.querySelectorAll("#main-nav a");
        navLinks.forEach((link) => {
          if (link.getAttribute("data-page") === currentPage) {
            link.classList.add("active");
          }
        });

        // Lắng nghe sự kiện Bật/Tắt Mobile Menu
        const mobileBtn = document.getElementById("mobile-btn");
        const mainNav = document.getElementById("main-nav");
        if (mobileBtn && mainNav) {
          mobileBtn.addEventListener("click", () =>
            mainNav.classList.toggle("show"),
          );
        }
      })
      .catch((err) => console.log("Lưu ý Header:", err));
  }

  // 2. Tự động Load Footer (Từ file components/footer.html)
  const footerPlaceholder = document.getElementById("footer-placeholder");
  if (footerPlaceholder) {
    fetch("components/footer.html")
      .then((response) => {
        if (!response.ok) throw new Error("Không thể nạp footer");
        return response.text();
      })
      .then((data) => {
        footerPlaceholder.innerHTML = data;
      })
      .catch((err) => console.log("Lưu ý Footer:", err));
  }

  // 3. Tự động bơm khung Modal phóng to ảnh (nếu chưa có)
  if (!document.getElementById("image-modal")) {
    const modalHTML = `
      <div id="image-modal" class="modal" onclick="closeModal(event)" style="display: none; position: fixed; z-index: 1000; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.88); justify-content: center; align-items: center;">
        <span class="modal-close" onclick="closeModal(event)" style="position: absolute; top: 20px; right: 30px; color: #fff; font-size: 35px; font-weight: bold; cursor: pointer;">&times;</span>
        
        <a id="modal-download" class="modal-download" href="" download onclick="event.stopPropagation()" style="position: absolute; top: 20px; right: 80px; color: #fff; background: rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 20px; text-decoration: none; display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; backdrop-filter: blur(5px); z-index: 1001;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Tải về
        </a>

        <img id="modal-img" src="" alt="Ảnh phóng to" onclick="event.stopPropagation()" style="max-width: 90%; max-height: 85vh; border-radius: 8px; box-shadow: 0 5px 25px rgba(0, 0, 0, 0.5);" />
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  // 4. Tự động quét và tải bộ ảnh (post-gallery)
  const galleries = document.querySelectorAll(".post-gallery");
  if (galleries.length > 0) {
    galleries.forEach((gallery) => {
      const start = parseInt(gallery.getAttribute("data-start"));
      const end = parseInt(gallery.getAttribute("data-end"));

      if (!start || !end) return;

      let htmlContent = "";
      for (let i = start; i <= end; i++) {
        const paddedNumber = String(i).padStart(3, "0");
        const downloadName = `GX-HoaGiang-${paddedNumber}.jpg`;
        const imageSrc = `./thu_vien/${i}.jpg`;

        htmlContent += `
          <img src="${imageSrc}" alt="Ảnh sự kiện Giáo Xứ Hòa Giang ${i}" loading="lazy" style="cursor: pointer; transition: transform 0.3s ease, opacity 0.3s ease;" onclick="openModal('${imageSrc}', '${downloadName}')" onmouseenter="this.style.transform='scale(1.02)'; this.style.opacity='0.9';" onmouseleave="this.style.transform='scale(1)'; this.style.opacity='1';">
        `;
      }
      gallery.innerHTML = htmlContent;
    });
  }

  // 5. Xử lý chức năng Tự động bọc link cho ảnh bài viết thông thường
  document.querySelectorAll(".card").forEach((card) => {
    const img = card.querySelector("img");
    const detailLink =
      card.querySelector(".card-title a, a.card-link, .article-header a") ||
      card.querySelector("a[href]");

    if (img && detailLink && img.parentElement.tagName !== "A") {
      const href = detailLink.getAttribute("href");
      const wrapper = document.createElement("a");
      wrapper.href = href;
      wrapper.style.display = "block";
      img.parentNode.insertBefore(wrapper, img);
      wrapper.appendChild(img);
    }
  });

  // 6. Xử lý Tìm kiếm và Lọc danh mục tin tức chuẩn xác
  const searchInput = document.getElementById("search-input");
  const suggestionsBox = document.getElementById("search-suggestions");
  const filterButtons = document.querySelectorAll(".filter-btn");

  let currentCategory = "all";

  function removeAccents(str) {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  }

  function normalizeCategory(str) {
    if (!str) return "";
    return removeAccents(str).replace(/[\s-]+/g, "");
  }

  window.filterAndSearch = function () {
    const rawKeyword = searchInput ? searchInput.value.trim() : "";
    const keyword = removeAccents(rawKeyword);
    let matchCount = 0;
    let suggestionHTML = "";

    const newsCards = document.querySelectorAll(".card");

    newsCards.forEach((card) => {
      const titleElem = card.querySelector(".card-title");
      const tagElem = card.querySelector(".tag");
      const linkElem =
        card.querySelector(".card-title a") || card.querySelector("a");

      const titleText = titleElem ? titleElem.textContent.trim() : "";
      const tagText = tagElem ? tagElem.textContent.trim() : "";
      const postUrl = linkElem ? linkElem.href : "#";

      const cleanTitle = removeAccents(titleText);
      const cleanTag = normalizeCategory(tagText);

      const matchesCategory =
        currentCategory === "all" || cleanTag === currentCategory;
      const matchesSearch =
        keyword === "" ||
        cleanTitle.includes(keyword) ||
        cleanTag.includes(keyword);

      if (matchesCategory && matchesSearch) {
        card.style.removeProperty("display");
        if (
          searchInput &&
          rawKeyword.length > 0 &&
          matchesSearch &&
          matchCount < 5 &&
          suggestionsBox
        ) {
          matchCount++;
          suggestionHTML += `
            <a href="${postUrl}" style="display: block; padding: 12px 18px; color: #333; text-decoration: none; border-bottom: 1px solid #f1f5f9; font-size: 14px; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">
              🔍 <b>${titleText}</b> <span style="font-size: 11px; color: #fff; background: var(--navy-blue, #0f2b5c); padding: 2px 8px; border-radius: 10px; float: right;">${tagText}</span>
            </a>
          `;
        }
      } else {
        card.style.setProperty("display", "none", "important");
      }
    });

    if (suggestionsBox) {
      if (searchInput && rawKeyword.length > 0 && suggestionHTML !== "") {
        suggestionsBox.innerHTML = suggestionHTML;
        suggestionsBox.style.display = "block";
      } else {
        suggestionsBox.style.display = "none";
      }
    }
  };

  if (searchInput) {
    searchInput.addEventListener("input", window.filterAndSearch);
    document.addEventListener("click", function (e) {
      if (
        !searchInput.contains(e.target) &&
        suggestionsBox &&
        !suggestionsBox.contains(e.target)
      ) {
        suggestionsBox.style.display = "none";
      }
    });
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      filterButtons.forEach((btn) => {
        btn.style.background = "#eee";
        btn.style.color = "#333";
        btn.classList.remove("active");
      });
      this.style.background = "var(--navy-blue)";
      this.style.color = "#fff";
      this.classList.add("active");

      const filterValue =
        this.getAttribute("data-filter") || this.textContent.trim();
      currentCategory = normalizeCategory(filterValue);
      window.filterAndSearch();
    });
  });

  // 7. Gọi Dynamic News
  loadDynamicNews();

  // 8. Tự động chèn 5 nút liên kết nổi sử dụng hình ảnh
  const floatingDiv = document.createElement("div");
  floatingDiv.innerHTML = `
    <div class="floating-widgets">
      <!-- 1. Fanpage Facebook -->
      <a href="https://www.facebook.com/gxhoagiangxdpherodoancongquy" target="_blank" class="float-btn" data-tooltip="Fanpage Giáo Xứ">
        <img src="img/fanbage_icon.webp" alt="Facebook">
      </a>

      <!-- 2. YouTube Giáo Xứ -->
      <a href="https://www.youtube.com/@giaoxuhoagiang1997" target="_blank" class="float-btn" data-tooltip="YouTube Giáo Xứ">
        <img src="img/youtube_icon.webp" alt="YouTube">
      </a>

      <!-- 3. TikTok Ban Truyền Thông -->
      <a href="https://www.tiktok.com/@gxhoagiang" target="_blank" class="float-btn" data-tooltip="TikTok Truyền Thông">
        <img src="img/tiktok_icon.webp" alt="TikTok">
      </a>
    </div>
  `;
  document.body.appendChild(floatingDiv);
});

// =========================================================
// CÁC HÀM HỖ TRỢ TOÀN CỤC (GLOBAL FUNCTIONS)
// =========================================================

function openModal(imgSrc, downloadName) {
  const modal = document.getElementById("image-modal");
  const modalImg = document.getElementById("modal-img");
  const modalDownload = document.getElementById("modal-download");

  if (modal && modalImg) {
    modal.style.display = "flex";
    modalImg.src = imgSrc;
    if (modalDownload) {
      modalDownload.href = imgSrc;
      modalDownload.setAttribute(
        "download",
        downloadName || "GX-HoaGiang-Image.jpg",
      );
    }
  }
}

function closeModal(event) {
  const modal = document.getElementById("image-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

async function loadDynamicNews() {
  const container = document.getElementById("dynamic-news-container");
  if (!container) return;

  try {
    const response = await fetch("tin-tuc.html");
    if (!response.ok) return;
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    const allCards = Array.from(doc.querySelectorAll(".card"));

    if (allCards.length === 0) return;

    let htmlContent = "";

    // 1. Phần Tin Hot (Lấy bài đầu tiên - index 0)
    const heroCard = allCards[0];
    if (heroCard) {
      const img = heroCard.querySelector("img")?.getAttribute("src") || "";
      const title =
        heroCard.querySelector(".card-title, h3, h2")?.textContent || "";
      const link = heroCard.querySelector("a")?.getAttribute("href") || "#";
      const tag = heroCard.querySelector(".tag")?.textContent || "Thông Báo";
      const desc = heroCard.querySelector(".card-desc, p")?.textContent || "";
      const date =
        heroCard.querySelector(".card-date, .article-meta")?.textContent || "";

      htmlContent += `
        <div class="container" style="margin-top: 20px;">
          <div class="section-header">
            <h2>Tin Hot</h2>
            <a href="tin-tuc.html" class="view-all">Xem tất cả tin tức ➔</a>
          </div>
          <div class="hero-card" style="margin-bottom: 30px;">
            <a href="${link}" style="display: block;">
              <img src="${img}" alt="${title}" class="hero-img" />
            </a>
            <div class="hero-body">
              <span class="tag">${tag}</span>
              <h2 class="hero-title" style="margin: 10px 0; color: var(--navy-blue); font-size: 1.8rem; font-weight: bold;">
                <a href="${link}" style="text-decoration: none; color: inherit;">${title}</a>
              </h2>
              <p class="hero-desc" style="color: var(--text-muted); margin-bottom: 15px">${desc}</p>
              <p class="article-meta" style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">${date}</p>
              <a href="${link}" class="btn-primary" style="display: inline-block;">
                Xem Chi Tiết ➔
              </a>
            </div>
          </div>
        </div>
      `;
    }

    // 2. Phần Tin Tức & Thông Báo Mới (Thay thành (1) để lấy tất cả tin tức)
    const gridCards = allCards.slice(1, 4);
    if (gridCards.length > 0) {
      htmlContent += `
        <section class="container section-padding" style="margin-bottom: 40px;">
          <div class="section-header">
            <h2>Tin Tức & Thông Báo Gần Đây</h2>
            <a href="tin-tuc.html" class="view-all">Xem tất cả tin tức ➔</a>
          </div>
          <div class="grid-3" style="margin-top: 20px;">
            ${gridCards
              .map((card) => {
                const img =
                  card.querySelector("img")?.getAttribute("src") || "";
                const title =
                  card.querySelector(".card-title, h3, h2")?.textContent || "";
                const link =
                  card.querySelector("a")?.getAttribute("href") || "#";
                const tag =
                  card.querySelector(".tag")?.textContent || "Thông Báo";
                const desc =
                  card.querySelector(".card-desc, p")?.textContent || "";
                const date =
                  card.querySelector(".card-date, .article-meta")
                    ?.textContent || "";

                return `
                  <article class="card">
                    <a href="${link}" style="display: block;">
                      <img src="${img}" alt="${title}" class="card-img" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
                    </a>
                    <div class="card-body" style="padding: 15px;">
                      <span class="tag">${tag}</span>
                      <h3 class="card-title" style="font-size: 1.2rem; margin: 10px 0;">
                        <a href="${link}" style="text-decoration: none; color: inherit;">${title}</a>
                      </h3>
                      <p class="card-desc" style="color: #555; font-size: 0.95rem; margin-bottom: 10px;">${desc}</p>
                      <p class="article-meta" style="color: #666; font-size: 0.9rem; margin-bottom: 10px;">${date}</p>
                      <a href="${link}" class="card-link" style="font-weight: bold; text-decoration: none;">Xem Chi Tiết ➔</a>
                    </div>
                  </article>
                `;
              })
              .join("")}
          </div>
        </section>
      `;
    }

    container.innerHTML = htmlContent;

    // Kích hoạt lại bộ lọc nếu có
    if (typeof window.filterAndSearch === "function") {
      window.filterAndSearch();
    }
  } catch (error) {
    console.error("Lỗi tự động cập nhật tin tức:", error);
  }
}

// Tự động lấy đường dẫn hiện tại và tạo thẻ canonical cho mọi trang
const canonicalLink = document.createElement("link");
canonicalLink.rel = "canonical";
canonicalLink.href = window.location.href;
document.head.appendChild(canonicalLink);
