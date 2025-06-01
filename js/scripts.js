// JavaScript for Global News Thailand website

// We will add functions here to:
// 1. Fetch video data from the YouTube API via a serverless function.
// 2. Dynamically create HTML to display the videos.
// 3. Handle any other interactive elements.

console.log("scripts.js loaded");

// const API_KEY = 'AIzaSyAQ520aoZPTIu6Wtx2wyMuhriPKDIZEKt0'; // API KEY REMOVED - Now handled by serverless function
const CHANNEL_ID = 'UCYtt64n9CErLA-4b7arJ5Sw'; // Your Channel ID
const NUM_FEATURED_VIDEOS = 1;
const NUM_GALLERY_VIDEOS = 9; // Number of videos for the main gallery
const TOTAL_VIDEOS_TO_FETCH = NUM_FEATURED_VIDEOS + NUM_GALLERY_VIDEOS;

document.addEventListener('DOMContentLoaded', () => {
    fetchVideos();
});

async function fetchVideos() {
    const videoGallery = document.querySelector('.video-gallery');
    const featuredVideoSection = document.getElementById('featured-video');

    if (!videoGallery || !featuredVideoSection) {
        console.error('Required video sections not found!');
        if (videoGallery) videoGallery.innerHTML = '<p>Page setup error.</p>';
        if (featuredVideoSection) featuredVideoSection.innerHTML = '<p>Page setup error.</p>';
        return;
    }

    // Show loader
    const loaderHTML = '<div class="loader"></div>';
    if (videoGallery) videoGallery.innerHTML = loaderHTML;
    if (featuredVideoSection) featuredVideoSection.innerHTML = loaderHTML;

    try {
        // Call the serverless function - UPDATED PATH FOR VERCEL
        const serverlessFunctionUrl = `/api/getYoutubeVideos?channelId=${CHANNEL_ID}&count=${TOTAL_VIDEOS_TO_FETCH}`;
        const response = await fetch(serverlessFunctionUrl);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Serverless Function Error:', errorData);
            throw new Error(`Failed to fetch videos from serverless function. Status: ${response.status}`);
        }
        
        const videoData = await response.json(); // This is the playlistData from the function

        if (videoData.items && videoData.items.length > 0) {
            const allVideos = videoData.items;
            
            const featuredVideos = allVideos.slice(0, NUM_FEATURED_VIDEOS);
            if (featuredVideos.length > 0) {
                displayFeaturedVideo(featuredVideos[0]);
            }

            const galleryVideos = allVideos.slice(NUM_FEATURED_VIDEOS, TOTAL_VIDEOS_TO_FETCH);
            displayVideos(galleryVideos);

        } else {
            if (videoGallery) videoGallery.innerHTML = '<p>No videos found or API error from function.</p>';
            if (featuredVideoSection) featuredVideoSection.innerHTML = ''; // Clear featured if no videos
            console.error('No videos found or API error from function:', videoData);
        }
    } catch (error) {
        if (videoGallery) videoGallery.innerHTML = '<p>Failed to fetch videos. Check console for errors.</p>';
        if (featuredVideoSection) featuredVideoSection.innerHTML = '<p>Failed to load featured video.</p>';
        console.error('Error in fetchVideos (client-side):', error);
    }
}

function displayVideos(videos) {
    const videoGallery = document.querySelector('.video-gallery');
    videoGallery.innerHTML = ''; // Clear loading message

    videos.forEach(video => {
        const videoId = video.snippet.resourceId.videoId;
        const title = video.snippet.title;
        const thumbnailUrl = video.snippet.thumbnails.high ? video.snippet.thumbnails.high.url : (video.snippet.thumbnails.medium ? video.snippet.thumbnails.medium.url : video.snippet.thumbnails.default.url);

        const videoItem = document.createElement('div');
        videoItem.classList.add('video-item');

        const thumbnailContainer = document.createElement('div');
        thumbnailContainer.classList.add('video-thumbnail-container');
        thumbnailContainer.style.backgroundImage = `url(${thumbnailUrl})`;

        // Play icon overlay (simple version, can be enhanced with CSS)
        const playIcon = document.createElement('div');
        playIcon.classList.add('play-icon');
        playIcon.innerHTML = '&#9658;'; // Unicode play symbol
        thumbnailContainer.appendChild(playIcon);

        thumbnailContainer.addEventListener('click', () => {
            // Create iframe only when thumbnail is clicked
            const iframe = document.createElement('iframe');
            iframe.setAttribute('src', `https://www.youtube.com/embed/${videoId}?autoplay=1`); // Added autoplay=1
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            iframe.setAttribute('allowfullscreen', '');
            
            // Replace thumbnail container content with iframe
            thumbnailContainer.innerHTML = ''; // Clear thumbnail and play icon
            thumbnailContainer.appendChild(iframe);
            thumbnailContainer.classList.add('video-playing'); // Add class to adjust styles if needed
        }, { once: true }); // Ensure the iframe is loaded only once

        const videoTitleElement = document.createElement('h3'); // This is the <h3> tag

        const titleLink = document.createElement('a'); // This is the <a> tag
        titleLink.href = `https://www.youtube.com/watch?v=${videoId}`;
        titleLink.target = '_blank';
        titleLink.rel = 'noopener noreferrer';
        titleLink.textContent = title; // The actual title text goes into the link

        videoTitleElement.appendChild(titleLink); // Put <a> inside <h3>

        const socialShareDiv = document.createElement('div');
        socialShareDiv.classList.add('social-share');
        
        // Social sharing links
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const encodedVideoUrl = encodeURIComponent(videoUrl);
        const encodedTitle = encodeURIComponent(title);

        const shares = [
            // { platform: 'Facebook', icon: 'fab fa-facebook-f', url: `https://www.facebook.com/sharer/sharer.php?u=${encodedVideoUrl}` }, // Facebook removed
            { platform: 'X', icon: 'fab fa-x-twitter', url: `https://twitter.com/intent/tweet?url=${encodedVideoUrl}&text=${encodedTitle}` }, // URL endpoint is still twitter.com for intent
            { platform: 'TikTok', icon: 'fab fa-tiktok', url: 'https://www.tiktok.com/@global.news.th', ariaLabel: 'Visit Global News Thailand on TikTok' }, // Links to the TikTok profile
            { platform: 'YouTube Comments', icon: 'fas fa-comments', url: videoUrl, ariaLabel: 'View or Add Comments on YouTube' } // Links to the YT video page
            // { platform: 'WhatsApp', icon: 'fab fa-whatsapp', url: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedVideoUrl}` }, // WhatsApp removed
            // { platform: 'Email', icon: 'fas fa-envelope', url: `mailto:?subject=${encodedTitle}&body=Check%20out%20this%20video:%20${encodedVideoUrl}` } // Email removed
            // Add more platforms here if needed (e.g., LinkedIn, Reddit, Pinterest)
        ];

        shares.forEach(share => {
            const link = document.createElement('a');
            link.href = share.url;
            link.target = '_blank'; // Open in a new tab
            link.rel = 'noopener noreferrer'; // Security best practice
            link.setAttribute('aria-label', share.ariaLabel || `Share on ${share.platform}`);
            link.classList.add('social-share-button');

            const icon = document.createElement('i');
            icon.className = share.icon; // Using className to set multiple classes if needed from Font Awesome
            link.appendChild(icon);
            socialShareDiv.appendChild(link);
        });

        // Clear placeholder if shares were added
        // socialShareDiv.innerHTML = ''; // This would clear the placeholder but we are adding to it.
        // Instead, we remove the placeholder before adding buttons if it exists.
        const placeholder = socialShareDiv.querySelector('.share-placeholder');
        if (placeholder) {
            socialShareDiv.removeChild(placeholder);
        }

        videoItem.appendChild(thumbnailContainer);
        videoItem.appendChild(videoTitleElement); // Append the h3 which now contains the link
        videoItem.appendChild(socialShareDiv); // Add the share div
        videoGallery.appendChild(videoItem);
    });
}

function displayFeaturedVideo(video) {
    const featuredVideoSection = document.getElementById('featured-video');
    if (!featuredVideoSection || !video) {
        // console.error('Featured video section or video data not found for displayFeaturedVideo!');
        if(featuredVideoSection) featuredVideoSection.innerHTML = ''; // Clear if no video data
        return;
    }

    featuredVideoSection.innerHTML = ''; // Clear any previous content

    const videoId = video.snippet.resourceId.videoId;
    const title = video.snippet.title;
    const description = video.snippet.description;
    const thumbnailUrl = video.snippet.thumbnails.maxres ? video.snippet.thumbnails.maxres.url : (video.snippet.thumbnails.high ? video.snippet.thumbnails.high.url : video.snippet.thumbnails.standard.url);

    // Create container for the featured video content
    const featuredItem = document.createElement('div');
    featuredItem.classList.add('featured-video-item');

    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.classList.add('featured-thumbnail-container');
    thumbnailContainer.style.backgroundImage = `url(${thumbnailUrl})`;

    const playIcon = document.createElement('div');
    playIcon.classList.add('play-icon');
    playIcon.innerHTML = '&#9658;';
    thumbnailContainer.appendChild(playIcon);

    thumbnailContainer.addEventListener('click', () => {
        const iframe = document.createElement('iframe');
        iframe.setAttribute('src', `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`);
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.setAttribute('allowfullscreen', '');
        thumbnailContainer.innerHTML = '';
        thumbnailContainer.appendChild(iframe);
        thumbnailContainer.classList.add('video-playing');
    }, { once: true });

    const textContentDiv = document.createElement('div');
    textContentDiv.classList.add('featured-text-content');

    const videoTitleElement = document.createElement('h2'); // Using h2 for featured title
    const titleLink = document.createElement('a');
    titleLink.href = `https://www.youtube.com/watch?v=${videoId}`;
    titleLink.target = '_blank';
    titleLink.rel = 'noopener noreferrer';
    titleLink.textContent = title; // The actual title text goes into the link
    videoTitleElement.appendChild(titleLink); // Put <a> inside <h2>

    const videoDescription = document.createElement('p');
    // Truncate description to a reasonable length (e.g., 150 characters)
    videoDescription.textContent = description.length > 150 ? description.substring(0, 150) + '...' : description;

    textContentDiv.appendChild(videoTitleElement); // Append the h2 which now contains the link
    textContentDiv.appendChild(videoDescription);

    // Add Social Share Buttons for Featured Video
    const socialShareDiv = document.createElement('div');
    socialShareDiv.classList.add('social-share');
    // Adjust margin for featured video context if needed, e.g., more top margin
    socialShareDiv.style.marginTop = '15px'; 

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const encodedVideoUrl = encodeURIComponent(videoUrl);
    const encodedTitle = encodeURIComponent(title);

    const shares = [
        { platform: 'X', icon: 'fab fa-x-twitter', url: `https://twitter.com/intent/tweet?url=${encodedVideoUrl}&text=${encodedTitle}`, ariaLabel: 'Share on X' },
        { platform: 'TikTok', icon: 'fab fa-tiktok', url: 'https://www.tiktok.com/@global.news.th', ariaLabel: 'Visit Global News Thailand on TikTok' },
        { platform: 'YouTube Comments', icon: 'fas fa-comments', url: videoUrl, ariaLabel: 'View or Add Comments on YouTube' }
    ];

    shares.forEach(share => {
        const link = document.createElement('a');
        link.href = share.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', share.ariaLabel);
        link.classList.add('social-share-button');

        const icon = document.createElement('i');
        icon.className = share.icon;
        link.appendChild(icon);
        socialShareDiv.appendChild(link);
    });

    textContentDiv.appendChild(socialShareDiv); // Append share buttons to text content

    featuredItem.appendChild(thumbnailContainer);
    featuredItem.appendChild(textContentDiv);
    
    featuredVideoSection.appendChild(featuredItem);
    // Make the section visible after adding content, if using scroll animations
    featuredVideoSection.classList.add('visible-section'); 
}

// Smooth scrolling for navigation links
document.querySelectorAll('header nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Back to Top Button Functionality
const backToTopButton = document.getElementById("back-to-top");

window.addEventListener("scroll", () => {
    if (window.pageYOffset > 300) { // Show button after scrolling 300px
        backToTopButton.classList.add("visible");
    } else {
        backToTopButton.classList.remove("visible");
    }
});

backToTopButton.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

// Scroll Animations for Sections
const sectionsToAnimate = document.querySelectorAll('main > section, #newsletter');

const sectionObserverOptions = {
    root: null, // relative to document viewport 
    rootMargin: '0px',
    threshold: 0.1 // 10% of item is visible
};

const sectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible-section');
            observer.unobserve(entry.target); // Stop observing once visible
        }
    });
}, sectionObserverOptions);

sectionsToAnimate.forEach(section => {
    sectionObserver.observe(section);
});

// Header scroll effect
const headerElement = document.querySelector('header');
const scrollThreshold = 50; // Pixels to scroll before effect activates

window.addEventListener('scroll', () => {
    if (window.pageYOffset > scrollThreshold) {
        headerElement.classList.add('header-scrolled');
    } else {
        headerElement.classList.remove('header-scrolled');
    }
});

// Newsletter Form Handling (New)
const newsletterForm = document.getElementById('newsletter-form');
const emailInputForNewsletter = document.getElementById('email-input-newsletter'); // Matching the new ID
const newsletterMessage = document.getElementById('newsletter-message');
const hiddenIframe = document.getElementById('hidden_iframe');
let formSubmittedViaJS = false;

if (newsletterForm && emailInputForNewsletter && newsletterMessage && hiddenIframe) {
    newsletterForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = emailInputForNewsletter.value;

        if (validateEmail(email)) {
            formSubmittedViaJS = true;
            newsletterForm.submit();
            newsletterMessage.textContent = 'Submitting...';
            newsletterMessage.style.color = 'orange';
        } else {
            newsletterMessage.textContent = 'Please enter a valid email address.';
            newsletterMessage.style.color = 'red';
            formSubmittedViaJS = false;
        }
    });

    hiddenIframe.addEventListener('load', function() {
        if (formSubmittedViaJS) {
            newsletterMessage.textContent = 'Thank you for subscribing!';
            newsletterMessage.style.color = 'green';
            emailInputForNewsletter.value = '';
            formSubmittedViaJS = false;
        }
    });
}

function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Header Search Form Placeholder - THIS IS THE CORRECT PLACEMENT
const headerSearchForm = document.getElementById('header-search-form');
const headerSearchInput = document.getElementById('header-search-input');

if (headerSearchForm && headerSearchInput) {
    headerSearchForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent default form submission
        const query = headerSearchInput.value.trim().toLowerCase();
        filterVideos(query);
    });

    headerSearchInput.addEventListener('input', function() {
        const query = headerSearchInput.value.trim().toLowerCase();
        filterVideos(query);
    });
}

function filterVideos(query) {
    console.log('Filtering for:', query);

    // Filter Featured Video
    const featuredVideoSection = document.getElementById('featured-video');
    if (featuredVideoSection) {
        const featuredVideoItem = featuredVideoSection.querySelector('.featured-video-item');
        if (featuredVideoItem) {
            const titleElement = featuredVideoItem.querySelector('.featured-text-content h2 a');
            if (titleElement) {
                const title = titleElement.textContent.toLowerCase();
                featuredVideoItem.style.display = title.includes(query) ? '' : 'none';
            }
        }
    }

    // Filter Gallery Videos
    const videoGallery = document.querySelector('.video-gallery');
    if (videoGallery) {
        const videos = videoGallery.querySelectorAll('.video-item');
        videos.forEach(video => {
            const titleElement = video.querySelector('h3 a');
            if (titleElement) {
                const title = titleElement.textContent.toLowerCase();
                video.style.display = title.includes(query) ? '' : 'none';
            }
        });
    }
}

// Reminder: For a live public website, the API_KEY should not be exposed client-side.
// Consider using a backend proxy or serverless function to make API calls securely. 
// THIS HAS NOW BEEN IMPLEMENTED by using the serverless function.

// Dark Mode Toggle - THIS IS THE CORRECT PLACEMENT
const themeToggleButton = document.getElementById('theme-toggle');
const bodyElement = document.body;
const sunIcon = 'fas fa-sun';
const moonIcon = 'fas fa-moon';

// Function to set the theme
function setTheme(theme) {
    if (theme === 'dark') {
        bodyElement.classList.add('dark-mode');
        if (themeToggleButton) themeToggleButton.innerHTML = `<i class="${sunIcon}"></i>`;
        localStorage.setItem('theme', 'dark');
    } else {
        bodyElement.classList.remove('dark-mode');
        if (themeToggleButton) themeToggleButton.innerHTML = `<i class="${moonIcon}"></i>`;
        localStorage.setItem('theme', 'light');
    }
}

// Event listener for the toggle button
if (themeToggleButton) {
    themeToggleButton.addEventListener('click', () => {
        if (bodyElement.classList.contains('dark-mode')) {
            setTheme('light');
        } else {
            setTheme('dark');
        }
    });
}

// Check for saved theme preference on load
document.addEventListener('DOMContentLoaded', () => {
    // The fetchVideos() is already called in DOMContentLoaded, so the theme setting should be fine here.
    // It might be slightly better to set theme first, but differences are likely negligible.
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkScheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (prefersDarkScheme) {
        setTheme('dark');
    } else {
        setTheme('light'); // Default to light
    }
});

// --- TRANSLATION LOGIC ---
const translations = {
  "en": {
    "nav_home": "Home",
    "nav_videos": "Videos",
    "nav_about": "About",
    "nav_community": "Community",
    "nav_contact": "Contact Us",
    "search_placeholder": "Search...",
    "search_button_aria_label": "Submit search",
    "theme_toggle_aria_label": "Toggle theme",
    "home_welcome_title": "Global News Thailand",
    "home_welcome_p1_strong": "Thailand's Stories, Global Impact.",
    "home_welcome_p1_normal": " Clear news from Thailand and beyond. Understand the world with us.",
    "videos_latest_title": "Latest Videos",
    "about_main_title": "About Global News Thailand",
    "about_mission_title": "📰 Global News Thailand – Official Channel Introduction",
    "about_mission_p1": "Stay informed. Stay aware. Stay connected.",
    "about_mission_p2": "Welcome to Global News Thailand — your independent window into the heart of Southeast Asia.",
    "about_mission_p3": "We bring you trusted news reports, sharp political analysis, and rare insights from Thailand and beyond. Our mission is to deliver accurate, timely, and unfiltered coverage that helps you understand the real forces shaping the region.",
    "about_what_we_cover_title": "🌏 What We Cover",
    "about_what_we_cover_li1": "Breaking news & current events",
    "about_what_we_cover_li2": "Politics, diplomacy & power shifts",
    "about_what_we_cover_li3": "Business trends & economic updates",
    "about_what_we_cover_li4": "Culture, society & untold local stories",
    "about_what_we_cover_li5": "Travel advisories & social impact journalism",
    "about_why_follow_title": "Why Follow Global News Thailand?",
    "about_why_follow_p1": "Because we believe in:",
    "about_why_follow_li1": "✅ On-the-ground reporting — we don't watch from afar",
    "about_why_follow_li2": "✅ Multilingual content — English, Thai, French",
    "about_why_follow_li3": "✅ AI-enhanced accessibility — fast, reliable, and clear",
    "about_why_follow_li4": "✅ Zero noise, zero spin — just facts and clarity",
    "about_why_follow_p2_line1": "Join a growing international audience that demands more than headlines.",
    "about_why_follow_p2_line2": "Subscribe now and investigate the world differently.",
    "community_join_title": "Join Our Thriving Community!",
    "community_join_p1": "The conversation doesn't end here! Follow Global News Thailand across your favorite platforms to get the latest updates, behind-the-scenes content, and engage directly with our team and fellow viewers. Become part of our growing global family today!",
    "community_social_youtube": "YouTube",
    "community_social_x": "X",
    "community_social_tiktok": "TikTok",
    "contact_title": "Contact Us",
    "contact_p1": "Have questions, suggestions, or news tips? We'd love to hear from you!",
    "contact_p2_prefix": "Please reach out to us at:",
    "newsletter_title": "Subscribe to Our Newsletter",
    "newsletter_p1": "Get breaking news, investigations, podcasts, and critical alerts delivered directly by our independent newsroom.",
    "newsletter_email_label": "Your email address *",
    "newsletter_email_placeholder": "Enter your email",
    "newsletter_subscribe_button": "Subscribe",
    "newsletter_message_submitting": "Submitting...",
    "newsletter_message_success": "Thank you for subscribing!",
    "newsletter_message_invalid_email": "Please enter a valid email address.",
    "footer_copyright": "© 2023 Global News Thailand. All rights reserved.",
    "footer_link_youtube": "YouTube",
    "footer_link_x": "X",
    "footer_link_tiktok": "TikTok",
    "back_to_top_title": "Back to Top"
  },
  "th": {
    "nav_home": "หน้าหลัก",
    "nav_videos": "วิดีโอ",
    "nav_about": "เกี่ยวกับเรา",
    "nav_community": "ชุมชน",
    "nav_contact": "ติดต่อเรา",
    "search_placeholder": "ค้นหา...",
    "search_button_aria_label": "ส่งการค้นหา",
    "theme_toggle_aria_label": "สลับธีม",
    "home_welcome_title": "Global News Thailand",
    "home_welcome_p1_strong": "เรื่องราวไทย สู่สากล",
    "home_welcome_p1_normal": " ข่าวสารชัดเจน จากไทยและทั่วโลก เข้าใจโลกไปกับเรา",
    "videos_latest_title": "วิดีโอล่าสุด",
    "about_main_title": "เกี่ยวกับ Global News Thailand",
    "about_mission_title": "📰 Global News Thailand – แนะนำช่องอย่างเป็นทางการ",
    "about_mission_p1": "รับข่าวสาร. รับรู้. เชื่อมต่อ.",
    "about_mission_p2": "ยินดีต้อนรับสู่ Global News Thailand — หน้าต่างอิสระของคุณสู่ใจกลางเอเชียตะวันออกเฉียงใต้",
    "about_mission_p3": "เรานำเสนอรายงานข่าวที่น่าเชื่อถือ, การวิเคราะห์ทางการเมืองที่เฉียบคม และข้อมูลเชิงลึกที่หาได้ยากจากประเทศไทยและทั่วโลก ภารกิจของเราคือการนำเสนอข่าวสารที่ถูกต้อง, ทันเวลา และไม่ผ่านการปรุงแต่ง เพื่อช่วยให้คุณเข้าใจพลังที่แท้จริงที่กำลังก่อร่างสร้างภูมิภาคนี้",
    "about_what_we_cover_title": "🌏 สิ่งที่เรานำเสนอ",
    "about_what_we_cover_li1": "ข่าวเด่น & เหตุการณ์ปัจจุบัน",
    "about_what_we_cover_li2": "การเมือง, การทูต & การเปลี่ยนแปลงอำนาจ",
    "about_what_we_cover_li3": "แนวโน้มธุรกิจ & การอัปเดตเศรษฐกิจ",
    "about_what_we_cover_li4": "วัฒนธรรม, สังคม & เรื่องราวท้องถิ่นที่ยังไม่ถูกเปิดเผย",
    "about_what_we_cover_li5": "คำแนะนำการเดินทาง & วารสารศาสตร์ผลกระทบทางสังคม",
    "about_why_follow_title": "ทำไมต้องติดตาม Global News Thailand?",
    "about_why_follow_p1": "เพราะเราเชื่อมั่นใน:",
    "about_why_follow_li1": "✅ การรายงานจากพื้นที่จริง — เราไม่ได้เฝ้าดูจากที่ไกล",
    "about_why_follow_li2": "✅ เนื้อหาหลากหลายภาษา — อังกฤษ, ไทย, ฝรั่งเศส",
    "about_why_follow_li3": "✅ การเข้าถึงที่เพิ่มขึ้นด้วย AI — รวดเร็ว, เชื่อถือได้ และชัดเจน",
    "about_why_follow_li4": "✅ ไร้เสียงรบกวน, ไร้การบิดเบือน — มีแต่ข้อเท็จจริงและความชัดเจน",
    "about_why_follow_p2_line1": "เข้าร่วมกับผู้ชมทั่วโลกที่กำลังเติบโตซึ่งต้องการมากกว่าแค่พาดหัวข่าว",
    "about_why_follow_p2_line2": "สมัครสมาชิกตอนนี้และสำรวจโลกในมุมมองที่แตกต่างออกไป",
    "community_join_title": "เข้าร่วมชุมชนที่เติบโตของเรา!",
    "community_join_p1": "การสนทนาไม่ได้จบลงที่นี่! ติดตาม Global News Thailand บนแพลตฟอร์มโปรดของคุณเพื่อรับข่าวสารล่าสุด, เนื้อหาเบื้องหลัง และมีส่วนร่วมโดยตรงกับทีมงานและผู้ชมคนอื่นๆ ของเรา มาร่วมเป็นส่วนหนึ่งของครอบครัวระดับโลกที่กำลังเติบโตของเราวันนี้!",
    "community_social_youtube": "YouTube",
    "community_social_x": "X",
    "community_social_tiktok": "TikTok",
    "contact_title": "ติดต่อเรา",
    "contact_p1": "มีคำถาม, ข้อเสนอแนะ หรือข่าวสารที่ต้องการแจ้ง? เรายินดีที่จะรับฟังจากคุณ!",
    "contact_p2_prefix": "โปรดติดต่อเราได้ที่:",
    "newsletter_title": "สมัครรับจดหมายข่าวของเรา",
    "newsletter_p1": "รับข่าวสารด่วน, การสืบสวน, พอดแคสต์ และการแจ้งเตือนที่สำคัญส่งตรงจากห้องข่าวอิสระของเรา",
    "newsletter_email_label": "ที่อยู่อีเมลของคุณ *",
    "newsletter_email_placeholder": "กรอกอีเมลของคุณ",
    "newsletter_subscribe_button": "สมัครสมาชิก",
    "newsletter_message_submitting": "กำลังส่ง...",
    "newsletter_message_success": "ขอบคุณสำหรับการสมัครสมาชิก!",
    "newsletter_message_invalid_email": "โปรดกรอกที่อยู่อีเมลที่ถูกต้อง",
    "footer_copyright": "© 2023 Global News Thailand. สงวนลิขสิทธิ์ทุกประการ",
    "footer_link_youtube": "YouTube",
    "footer_link_x": "X",
    "footer_link_tiktok": "TikTok",
    "back_to_top_title": "กลับขึ้นด้านบน"
  },
  "fr": {
    "nav_home": "Accueil",
    "nav_videos": "Vidéos",
    "nav_about": "À propos",
    "nav_community": "Communauté",
    "nav_contact": "Nous contacter",
    "search_placeholder": "Rechercher...",
    "search_button_aria_label": "Lancer la recherche",
    "theme_toggle_aria_label": "Basculer le thème",
    "home_welcome_title": "Global News Thailand",
    "home_welcome_p1_strong": "Histoires de Thaïlande, Impact Mondial.",
    "home_welcome_p1_normal": " Actualités claires de Thaïlande et d'ailleurs. Comprenez le monde avec nous.",
    "videos_latest_title": "Dernières vidéos",
    "about_main_title": "À propos de Global News Thailand",
    "about_mission_title": "📰 Global News Thailand – Présentation officielle de la chaîne",
    "about_mission_p1": "Restez informé. Restez conscient. Restez connecté.",
    "about_mission_p2": "Bienvenue sur Global News Thailand — votre fenêtre indépendante au cœur de l'Asie du Sud-Est.",
    "about_mission_p3": "Nous vous apportons des reportages fiables, des analyses politiques pointues et des aperçus rares de Thaïlande et d'ailleurs. Notre mission est de fournir une couverture précise, rapide et non filtrée qui vous aide à comprendre les forces réelles qui façonnent la région.",
    "about_what_we_cover_title": "🌏 Ce que nous couvrons",
    "about_what_we_cover_li1": "Actualités et événements en direct",
    "about_what_we_cover_li2": "Politique, diplomatie et changements de pouvoir",
    "about_what_we_cover_li3": "Tendances économiques et mises à jour financières",
    "about_what_we_cover_li4": "Culture, société et histoires locales inédites",
    "about_what_we_cover_li5": "Conseils de voyage et journalisme à impact social",
    "about_why_follow_title": "Pourquoi suivre Global News Thailand ?",
    "about_why_follow_p1": "Parce que nous croyons en :",
    "about_why_follow_li1": "✅ Des reportages sur le terrain — nous ne nous contentons pas d'observer de loin",
    "about_why_follow_li2": "✅ Un contenu multilingue — anglais, thaï, français",
    "about_why_follow_li3": "✅ Une accessibilité améliorée par l'IA — rapide, fiable et claire",
    "about_why_follow_li4": "✅ Zéro bruit, zéro manipulation — juste des faits et de la clarté",
    "about_why_follow_p2_line1": "Rejoignez une audience internationale grandissante qui exige plus que des gros titres.",
    "about_why_follow_p2_line2": "Abonnez-vous maintenant et explorez le monde différemment.",
    "community_join_title": "Rejoignez notre communauté florissante !",
    "community_join_p1": "La conversation ne s'arrête pas ici ! Suivez Global News Thailand sur vos plateformes préférées pour recevoir les dernières mises à jour, du contenu en coulisses et interagir directement avec notre équipe et les autres spectateurs. Faites partie de notre famille mondiale grandissante dès aujourd'hui !",
    "community_social_youtube": "YouTube",
    "community_social_x": "X",
    "community_social_tiktok": "TikTok",
    "contact_title": "Nous contacter",
    "contact_p1": "Vous avez des questions, des suggestions ou des informations à nous communiquer ? Nous serions ravis de vous entendre !",
    "contact_p2_prefix": "Veuillez nous contacter à :",
    "newsletter_title": "Abonnez-vous à notre newsletter",
    "newsletter_p1": "Recevez des infos de dernière minute, des enquêtes, des podcasts et des alertes critiques directement de notre rédaction indépendante.",
    "newsletter_email_label": "Votre adresse e-mail *",
    "newsletter_email_placeholder": "Entrez votre e-mail",
    "newsletter_subscribe_button": "S'abonner",
    "newsletter_message_submitting": "Envoi en cours...",
    "newsletter_message_success": "Merci de votre abonnement !",
    "newsletter_message_invalid_email": "Veuillez entrer une adresse e-mail valide.",
    "footer_copyright": "© 2023 Global News Thailand. Tous droits réservés.",
    "footer_link_youtube": "YouTube",
    "footer_link_x": "X",
    "footer_link_tiktok": "TikTok",
    "back_to_top_title": "Retour en haut"
  }
};

let currentLanguage = 'en'; // Default language

function applyTranslations(language) {
    if (!translations[language]) {
        console.warn(`No translations found for language: ${language}`);
        return;
    }
    currentLanguage = language;
    localStorage.setItem('selectedLanguage', language);
    document.documentElement.lang = language; // Update html lang attribute

    document.querySelectorAll('[data-translate-key]').forEach(element => {
        const key = element.getAttribute('data-translate-key');
        if (translations[language][key]) {
            element.textContent = translations[language][key];
        }
    });
    document.querySelectorAll('[data-translate-placeholder-key]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder-key');
        if (translations[language][key]) {
            element.placeholder = translations[language][key];
        }
    });
    document.querySelectorAll('[data-translate-aria-label-key]').forEach(element => {
        const key = element.getAttribute('data-translate-aria-label-key');
        if (translations[language][key]) {
            element.setAttribute('aria-label', translations[language][key]);
        }
    });
    document.querySelectorAll('[data-translate-title-key]').forEach(element => {
        const key = element.getAttribute('data-translate-title-key');
        if (translations[language][key]) {
            element.setAttribute('title', translations[language][key]);
        }
    });

    // Update active class on language switcher links
    document.querySelectorAll('.language-switcher .lang-link').forEach(link => {
        if (link.getAttribute('data-lang') === language) {
            link.classList.add('active-lang');
        } else {
            link.classList.remove('active-lang');
        }
    });

    // Special handling for home_welcome_p1_normal because it's a span after a strong
    // The keys are set up so that the strong and span are separate. The JS above handles them.
    // We might need to re-evaluate if the strong tag itself needs to be part of the translated string for some languages.
    // For now, assuming separate translations are fine.
}

// Language Switcher Event Listeners
const languageSwitcher = document.querySelector('.language-switcher');
if (languageSwitcher) {
    languageSwitcher.addEventListener('click', (event) => {
        if (event.target.classList.contains('lang-link')) {
            event.preventDefault();
            const selectedLang = event.target.getAttribute('data-lang');
            applyTranslations(selectedLang);
        }
    });
}

// Modify Newsletter form messages to use translations
// Existing newsletter form handling ...
// We need to make sure messages like 'Submitting...', 'Thank you...', 'Please enter...' use keys.
// Example of how to modify the newsletter form submission part:
const originalNewsletterForm = document.getElementById('newsletter-form');
const originalEmailInput = document.getElementById('email-input-newsletter');
const originalNewsletterMessage = document.getElementById('newsletter-message');
const originalHiddenIframe = document.getElementById('hidden_iframe');
let originalFormSubmittedViaJS = false;

if (originalNewsletterForm && originalEmailInput && originalNewsletterMessage && originalHiddenIframe) {
    originalNewsletterForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = originalEmailInput.value;

        if (validateEmail(email)) {
            originalFormSubmittedViaJS = true;
            originalNewsletterForm.submit();
            originalNewsletterMessage.textContent = translations[currentLanguage]['newsletter_message_submitting'];
            originalNewsletterMessage.style.color = 'orange';
        } else {
            originalNewsletterMessage.textContent = translations[currentLanguage]['newsletter_message_invalid_email'];
            originalNewsletterMessage.style.color = 'red';
            originalFormSubmittedViaJS = false;
        }
    });

    originalHiddenIframe.addEventListener('load', function() {
        if (originalFormSubmittedViaJS) {
            originalNewsletterMessage.textContent = translations[currentLanguage]['newsletter_message_success'];
            originalNewsletterMessage.style.color = 'green';
            originalEmailInput.value = '';
            originalFormSubmittedViaJS = false;
        }
    });
}


// --- END OF TRANSLATION LOGIC ---

// Adjust DOMContentLoaded to set initial language
document.addEventListener('DOMContentLoaded', () => {
    // Theme setting from previous logic
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkScheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (prefersDarkScheme) {
        setTheme('dark');
    } else {
        setTheme('light');
    }

    // Language setting
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage && translations[savedLanguage]) {
        applyTranslations(savedLanguage);
    } else {
        applyTranslations('en'); // Default to English if no saved pref or invalid
    }
}); 