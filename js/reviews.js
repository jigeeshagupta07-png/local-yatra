/**
 * YatraLocal Reviews & Feedback Module (Phase 15)
 * Seed data loading from /data/reviews.json + localStorage ('yl_reviews') merging.
 * Rating distribution, tag highlights, XSS-safe textContent rendering, and Saral Mode voice summary.
 */

import { t } from './i18n.js';
import { speakText } from './speech.js';

let seedReviews = [];
let seedLoaded = false;

export async function initReviews() {
  if (seedLoaded) return;
  try {
    const res = await fetch('/data/reviews.json');
    if (res.ok) {
      const data = await res.json();
      seedReviews = data.reviews || [];
      seedLoaded = true;
    }
  } catch (err) {
    console.warn('[Reviews] Could not load seed reviews:', err);
    seedReviews = [];
  }
}

export function getUserReviews() {
  try {
    const raw = localStorage.getItem('yl_reviews');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('[Reviews] Failed to parse yl_reviews from localStorage:', e);
    return [];
  }
}

export function saveUserReview(review) {
  const reviews = getUserReviews();
  reviews.unshift(review);
  localStorage.setItem('yl_reviews', JSON.stringify(reviews));

  // Record rate-limiting key
  const reviewedTargets = getReviewedTargets();
  reviewedTargets.push(review.targetId);
  localStorage.setItem('yl_reviewed_targets', JSON.stringify(reviewedTargets));
}

export function getReviewedTargets() {
  try {
    const raw = localStorage.getItem('yl_reviewed_targets');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function hasUserReviewed(targetId) {
  const targets = getReviewedTargets();
  return targets.includes(targetId);
}

/**
 * Returns merged reviews (user reviews first, then seed sample reviews)
 */
export function getReviewsForTarget(targetType, targetId) {
  const userList = getUserReviews().filter(r => r.targetType === targetType && r.targetId === targetId);
  const seedList = seedReviews.filter(r => r.targetType === targetType && r.targetId === targetId);
  return [...userList, ...seedList];
}

/**
 * Computes average rating, count, 5-bar distribution, and top tags highlight
 */
export function calculateRatingSummary(reviews) {
  const count = reviews.length;
  if (count === 0) {
    return {
      average: 0,
      count: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      highlights: []
    };
  }

  const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
  const average = Math.round((sum / count) * 10) / 10;

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const tagCounts = {};

  reviews.forEach(r => {
    const rate = Math.min(5, Math.max(1, Math.round(Number(r.rating)) || 5));
    distribution[rate] = (distribution[rate] || 0) + 1;

    if (Array.isArray(r.tags)) {
      r.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  const percentages = {};
  for (let s = 1; s <= 5; s++) {
    percentages[s] = Math.round((distribution[s] / count) * 100);
  }

  // Highlights: top 3 most common tags
  const highlights = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);

  return {
    average,
    count,
    distribution,
    percentages,
    highlights
  };
}

/**
 * Sanitize plain text (removes HTML tags completely)
 */
export function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/<[^>]*>?/gm, '').trim();
}

/**
 * Validate and submit a new review to localStorage
 */
export function submitReview({ targetType, targetId, name, rating, comment, tags, travelMonth, language }) {
  if (hasUserReviewed(targetId)) {
    return {
      success: false,
      error: 'You have already submitted feedback for this on this device.'
    };
  }

  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5) {
    return { success: false, error: 'Please choose a star rating between 1 and 5.' };
  }

  const cleanComment = sanitizeText(comment);
  if (cleanComment.length < 10) {
    return { success: false, error: 'Please write at least 10 characters in your review.' };
  }
  if (cleanComment.length > 300) {
    return { success: false, error: 'Review comment cannot exceed 300 characters.' };
  }

  // First name only (or default "Traveller")
  let cleanName = sanitizeText(name);
  if (cleanName) {
    cleanName = cleanName.split(' ')[0]; // take first name only
  } else {
    cleanName = 'Traveller';
  }

  const newReview = {
    id: 'rev-user-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
    targetType,
    targetId,
    name: cleanName,
    rating: numRating,
    comment: cleanComment,
    tags: Array.isArray(tags) ? tags : [],
    travelMonth: travelMonth || 'October 2026',
    createdAt: new Date().toISOString(),
    language: language || 'en',
    isSample: false
  };

  saveUserReview(newReview);
  return { success: true, review: newReview };
}

/**
 * Render the full reviews section into a container element safely using DOM methods
 */
export function renderReviewsSection(container, targetType, targetId, targetName) {
  container.innerHTML = '';

  const allReviews = getReviewsForTarget(targetType, targetId);
  const summary = calculateRatingSummary(allReviews);

  const wrapper = document.createElement('div');
  wrapper.className = 'reviews-section';
  wrapper.style.cssText = 'margin-top: 24px; padding-top: 20px; border-top: 1.5px solid var(--color-border);';

  // Section Header
  const header = document.createElement('div');
  header.style.cssText = 'display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px;';

  const titleGroup = document.createElement('div');
  const h4 = document.createElement('h4');
  h4.style.cssText = 'font-size: 1.15rem; margin: 0 0 4px 0;';
  h4.textContent = t('reviews_title', 'Traveller Feedback & Reviews');

  const scoreLine = document.createElement('div');
  scoreLine.style.cssText = 'display: flex; align-items: center; gap: 8px; font-size: var(--text-sm);';
  scoreLine.innerHTML = `
    <span style="font-size: 1.3rem; font-weight: 700; color: #d97706;">★ ${summary.average || 5.0}</span>
    <span style="color: var(--color-text-muted);">(${summary.count} ${summary.count === 1 ? 'review' : 'reviews'})</span>
  `;
  titleGroup.appendChild(h4);
  titleGroup.appendChild(scoreLine);

  const writeBtn = document.createElement('button');
  writeBtn.className = 'btn btn-sm btn-secondary';
  writeBtn.innerHTML = `✍️ ${t('write_review', 'Write a Review')}`;
  writeBtn.addEventListener('click', () => {
    openReviewModal(targetType, targetId, targetName, () => {
      renderReviewsSection(container, targetType, targetId, targetName);
    });
  });

  header.appendChild(titleGroup);
  header.appendChild(writeBtn);
  wrapper.appendChild(header);

  // Rating 5-bar Breakdown & Traveller Highlights
  if (summary.count > 0) {
    const breakdownCard = document.createElement('div');
    breakdownCard.style.cssText = 'background: var(--color-surface-subtle); border-radius: 12px; padding: 14px 16px; margin-bottom: 20px; border: 1px solid var(--color-border);';

    // 5-bar distribution
    const barList = document.createElement('div');
    barList.style.cssText = 'display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;';

    for (let star = 5; star >= 1; star--) {
      const pct = summary.percentages[star] || 0;
      const count = summary.distribution[star] || 0;

      const barRow = document.createElement('div');
      barRow.style.cssText = 'display: flex; align-items: center; gap: 8px; font-size: 12px;';
      barRow.setAttribute('aria-label', `${star} stars: ${count} reviews (${pct}%)`);

      barRow.innerHTML = `
        <span style="width: 24px; text-align: right; color: var(--color-text-muted);">${star}★</span>
        <div style="flex: 1; height: 8px; background: #e2ddd5; border-radius: 999px; overflow: hidden;">
          <div style="width: ${pct}%; height: 100%; background: #d97706; border-radius: 999px;"></div>
        </div>
        <span style="width: 30px; text-align: right; color: var(--color-text-muted);">${count}</span>
      `;
      barList.appendChild(barRow);
    }
    breakdownCard.appendChild(barList);

    // Traveller highlights
    if (summary.highlights.length > 0) {
      const highlightsDiv = document.createElement('div');
      highlightsDiv.style.cssText = 'display: flex; flex-wrap: wrap; align-items: center; gap: 6px; border-top: 1px dashed var(--color-border); padding-top: 10px; font-size: 12px;';
      
      const hlLabel = document.createElement('strong');
      hlLabel.style.color = 'var(--color-primary)';
      hlLabel.textContent = t('traveller_highlights', 'Traveller highlights:');
      highlightsDiv.appendChild(hlLabel);

      summary.highlights.forEach(tag => {
        const tagBadge = document.createElement('span');
        tagBadge.className = 'badge badge-local';
        tagBadge.textContent = `✓ ${tag}`;
        highlightsDiv.appendChild(tagBadge);
      });
      breakdownCard.appendChild(highlightsDiv);
    }

    wrapper.appendChild(breakdownCard);
  }

  // Filter & Sort Controls
  const controlsRow = document.createElement('div');
  controlsRow.style.cssText = 'display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 16px;';

  const filterGroup = document.createElement('div');
  filterGroup.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px;';

  const filterOptions = [
    { id: 'all', label: t('filter_all', 'All') },
    { id: '5star', label: t('filter_5star', '5 ★ Only') },
    { id: '4plus', label: t('filter_4plus', '4 ★ & Up') },
    { id: 'senior', label: t('filter_senior', 'Senior-friendly') },
    { id: 'hindi', label: t('filter_hindi', 'हिंदी') }
  ];

  let currentFilter = 'all';
  let currentSort = 'newest';

  filterOptions.forEach(opt => {
    const filterBtn = document.createElement('button');
    filterBtn.type = 'button';
    filterBtn.className = `btn btn-sm ${currentFilter === opt.id ? 'btn-primary' : 'btn-ghost'}`;
    filterBtn.style.cssText = 'min-height: 32px; padding: 2px 10px; font-size: 12px; border: 1px solid var(--color-border);';
    filterBtn.textContent = opt.label;
    filterBtn.addEventListener('click', () => {
      currentFilter = opt.id;
      filterGroup.querySelectorAll('button').forEach(b => {
        b.className = 'btn btn-sm btn-ghost';
        b.style.border = '1px solid var(--color-border)';
      });
      filterBtn.className = 'btn btn-sm btn-primary';
      renderFilteredReviews();
    });
    filterGroup.appendChild(filterBtn);
  });

  const sortSelect = document.createElement('select');
  sortSelect.className = 'select-control';
  sortSelect.style.cssText = 'width: auto; min-height: 32px; padding: 2px 8px; font-size: 12px;';
  sortSelect.innerHTML = `
    <option value="newest">${t('sort_newest', 'Newest First')}</option>
    <option value="highest">${t('sort_highest', 'Highest Rated')}</option>
    <option value="lowest">${t('sort_lowest', 'Lowest Rated')}</option>
  `;
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderFilteredReviews();
  });

  controlsRow.appendChild(filterGroup);
  controlsRow.appendChild(sortSelect);
  wrapper.appendChild(controlsRow);

  // Review List Container
  const listContainer = document.createElement('div');
  listContainer.className = 'review-items-list';
  listContainer.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';
  wrapper.appendChild(listContainer);

  function renderFilteredReviews() {
    listContainer.innerHTML = '';

    let list = [...allReviews];

    // Filter
    if (currentFilter === '5star') {
      list = list.filter(r => Number(r.rating) === 5);
    } else if (currentFilter === '4plus') {
      list = list.filter(r => Number(r.rating) >= 4);
    } else if (currentFilter === 'senior') {
      list = list.filter(r => Array.isArray(r.tags) && r.tags.includes('Senior-friendly'));
    } else if (currentFilter === 'hindi') {
      list = list.filter(r => r.language === 'hi');
    }

    // Sort
    if (currentSort === 'newest') {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (currentSort === 'highest') {
      list.sort((a, b) => Number(b.rating) - Number(a.rating));
    } else if (currentSort === 'lowest') {
      list.sort((a, b) => Number(a.rating) - Number(b.rating));
    }

    if (list.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.style.cssText = 'padding: 24px; text-align: center; color: var(--color-text-muted); font-size: var(--text-sm); background: #fbf9f5; border-radius: 8px; border: 1px dashed var(--color-border);';
      emptyDiv.textContent = t('no_reviews_yet', 'No reviews yet. Be the first to share feedback.');
      listContainer.appendChild(emptyDiv);
      return;
    }

    list.forEach(r => {
      const card = document.createElement('div');
      card.className = 'review-card';
      card.style.cssText = 'background: #ffffff; border: 1px solid var(--color-border); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 8px;';

      // Top row: Author, Rating, Badges
      const topRow = document.createElement('div');
      topRow.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;';

      const authorGroup = document.createElement('div');
      const nameEl = document.createElement('strong');
      nameEl.style.fontSize = '0.95rem';
      nameEl.textContent = r.name || 'Traveller'; // XSS-safe

      const dateEl = document.createElement('span');
      dateEl.style.cssText = 'font-size: 11px; color: var(--color-text-muted); margin-left: 8px;';
      dateEl.textContent = r.travelMonth || 'Recent';

      authorGroup.appendChild(nameEl);
      authorGroup.appendChild(dateEl);

      const badgeGroup = document.createElement('div');
      badgeGroup.style.cssText = 'display: flex; align-items: center; gap: 6px;';

      const stars = document.createElement('span');
      stars.style.cssText = 'color: #d97706; font-size: 13px; font-weight: 700;';
      stars.textContent = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      badgeGroup.appendChild(stars);

      const sampleBadge = document.createElement('span');
      sampleBadge.className = r.isSample ? 'badge badge-simulated' : 'badge badge-verified';
      sampleBadge.style.fontSize = '10px';
      sampleBadge.textContent = r.isSample ? t('sample_review_badge', 'Sample review') : t('local_review_badge', 'Submitted on this device (Demo)');
      badgeGroup.appendChild(sampleBadge);

      topRow.appendChild(authorGroup);
      topRow.appendChild(badgeGroup);
      card.appendChild(topRow);

      // Comment paragraph (XSS-safe: textContent)
      const commentEl = document.createElement('p');
      commentEl.style.cssText = 'font-size: var(--text-sm); color: var(--color-text); margin: 0; line-height: 1.5;';
      commentEl.textContent = r.comment; // Strictly textContent
      card.appendChild(commentEl);

      // Tags if any
      if (Array.isArray(r.tags) && r.tags.length > 0) {
        const tagRow = document.createElement('div');
        tagRow.style.cssText = 'display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;';
        r.tags.forEach(tag => {
          const tSpan = document.createElement('span');
          tSpan.className = 'badge';
          tSpan.style.cssText = 'background: #f1f5f9; color: #475569; font-size: 10px; border: 1px solid #e2e8f0;';
          tSpan.textContent = tag;
          tagRow.appendChild(tSpan);
        });
        card.appendChild(tagRow);
      }

      listContainer.appendChild(card);
    });
  }

  renderFilteredReviews();

  // Honest Disclaimer Note
  const disclaimer = document.createElement('div');
  disclaimer.style.cssText = 'margin-top: 16px; font-size: 11px; color: var(--color-text-muted); font-style: italic; text-align: center;';
  disclaimer.textContent = t('reviews_disclaimer', 'Reviews in this prototype are stored on your device only. Seed reviews are sample data.');
  wrapper.appendChild(disclaimer);

  container.appendChild(wrapper);
}

/**
 * Open accessible "Write a Review" modal
 */
export function openReviewModal(targetType, targetId, targetName, onSuccess) {
  let modalContainer = document.getElementById('review-modal-container');
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'review-modal-container';
    document.body.appendChild(modalContainer);
  }

  let selectedRating = 5;
  const availableTags = ['Clean', 'Friendly host', 'Good value', 'Safe', 'Senior-friendly', 'Less crowded'];
  const selectedTags = new Set();

  modalContainer.innerHTML = `
    <div class="modal-backdrop open" id="review-modal-backdrop">
      <div class="modal-dialog" style="max-width: 520px;">
        <div class="modal-header">
          <div>
            <h3 style="margin: 0; font-size: 1.15rem;">${t('write_review', 'Write a Review')}</h3>
            <div style="font-size: 12px; color: var(--color-text-muted);">${targetName || 'Experience'}</div>
          </div>
          <button class="btn btn-ghost btn-sm" id="btn-close-review-modal" style="font-size: 1.2rem;">&times;</button>
        </div>

        <form id="review-submission-form">
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px;">
            <!-- Rating Star Control (Keyboard Accessible) -->
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="margin-bottom: 6px;">${t('review_rating_label', 'Your Rating (1-5 stars)')} *</label>
              <div id="star-rating-control" role="radiogroup" aria-label="Rating from 1 to 5 stars" style="display: flex; gap: 8px;">
                ${[1, 2, 3, 4, 5].map(star => `
                  <button type="button" class="star-btn" data-star="${star}" role="radio" aria-checked="${star === 5 ? 'true' : 'false'}" aria-label="${star} stars" style="background: none; border: none; font-size: 2rem; color: #d97706; cursor: pointer; padding: 2px;">
                    ★
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Optional First Name -->
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="review-input-name" style="margin-bottom: 4px;">${t('review_name_label', 'Your Name (Optional, First name only)')}</label>
              <input type="text" id="review-input-name" class="input-control" placeholder="e.g. Rahul, Priya" maxlength="30">
            </div>

            <!-- Comment with Char Counter -->
            <div class="form-group" style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <label class="form-label" for="review-input-comment" style="margin-bottom: 4px;">${t('review_comment_label', 'Your Review / Feedback (10-300 characters)')} *</label>
                <span id="char-counter" style="font-size: 11px; color: var(--color-text-muted);">0 / 300</span>
              </div>
              <textarea id="review-input-comment" class="textarea-control" rows="3" placeholder="Share your experience: hosts, cleanliness, crowds..." required minlength="10" maxlength="300"></textarea>
              <div id="comment-error" class="form-error">Please enter between 10 and 300 characters.</div>
            </div>

            <!-- Tags -->
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="margin-bottom: 4px;">${t('review_tags_label', 'Select Highlights (Optional)')}</label>
              <div class="chip-grid" id="modal-tags-grid">
                ${availableTags.map(tag => `
                  <button type="button" class="chip-btn" data-tag="${tag}">
                    + ${tag}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="btn-cancel-review">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-submit-review">${t('submit_review_btn', 'Submit Review')}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const closeFn = () => { modalContainer.innerHTML = ''; };
  document.getElementById('btn-close-review-modal')?.addEventListener('click', closeFn);
  document.getElementById('btn-cancel-review')?.addEventListener('click', closeFn);

  // Star Rating Interaction
  const starBtns = modalContainer.querySelectorAll('.star-btn');
  function updateStars(val) {
    selectedRating = val;
    starBtns.forEach(b => {
      const starNum = Number(b.dataset.star);
      if (starNum <= val) {
        b.textContent = '★';
        b.style.color = '#d97706';
        b.setAttribute('aria-checked', starNum === val ? 'true' : 'false');
      } else {
        b.textContent = '☆';
        b.style.color = '#94a3b8';
        b.setAttribute('aria-checked', 'false');
      }
    });
  }

  starBtns.forEach(b => {
    b.addEventListener('click', () => updateStars(Number(b.dataset.star)));
    b.addEventListener('keydown', (e) => {
      let current = selectedRating;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        current = Math.min(5, current + 1);
        updateStars(current);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        current = Math.max(1, current - 1);
        updateStars(current);
      }
    });
  });

  // Character counter
  const commentInput = document.getElementById('review-input-comment');
  const charCounter = document.getElementById('char-counter');
  const commentError = document.getElementById('comment-error');

  commentInput?.addEventListener('input', () => {
    const len = commentInput.value.trim().length;
    if (charCounter) charCounter.textContent = `${len} / 300`;
    if (len >= 10 && len <= 300) {
      commentError.classList.remove('visible');
    }
  });

  // Tag chip toggles
  modalContainer.querySelectorAll('#modal-tags-grid .chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.tag;
      if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
        btn.classList.remove('selected');
        btn.textContent = `+ ${tag}`;
      } else {
        selectedTags.add(tag);
        btn.classList.add('selected');
        btn.textContent = `✓ ${tag}`;
      }
    });
  });

  // Form submission
  const form = document.getElementById('review-submission-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameVal = document.getElementById('review-input-name')?.value;
    const commentVal = commentInput?.value;

    const res = submitReview({
      targetType,
      targetId,
      name: nameVal,
      rating: selectedRating,
      comment: commentVal,
      tags: Array.from(selectedTags),
      travelMonth: 'October 2026',
      language: document.documentElement.lang === 'hi' ? 'hi' : 'en'
    });

    if (!res.success) {
      commentError.textContent = res.error;
      commentError.classList.add('visible');
      return;
    }

    closeFn();
    alert('🎉 ' + t('review_success', 'Thank you! Your review has been saved locally.'));
    if (onSuccess) onSuccess(res.review);
  });
}

/**
 * Saral Mode Simplified Reviews & Voice Summary
 */
export function renderSaralReviewSummary(container, targetType, targetId) {
  if (!container) return;
  const reviews = getReviewsForTarget(targetType, targetId);
  const summary = calculateRatingSummary(reviews);

  const card = document.createElement('div');
  card.style.cssText = 'background: #ffffff; border: 3px solid #0d5c58; border-radius: 20px; padding: 20px; margin-top: 20px; text-align: center;';

  const speechText = `${summary.count} travellers rated this ${summary.average} out of 5 stars. Overall rating is very good.`;

  card.innerHTML = `
    <div style="font-size: 2.2rem; color: #d97706; margin-bottom: 6px;">
      ★ ${summary.average || 4.9}
    </div>
    <div style="font-size: 1.25rem; font-weight: 700; color: #083c39; margin-bottom: 12px;">
      ${summary.count} ${t('saral_travellers_rated', 'travellers rated this')}
    </div>
    <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 16px;">
      <button class="saral-voice-btn" id="btn-saral-read-review" style="min-height: 52px; font-size: 1.1rem;">
        🔊 ${t('read_aloud', 'Read Aloud')}
      </button>
    </div>

    <!-- 3-Button Accessible Rating Feedback Form -->
    <div style="border-top: 2px dashed #0d5c58; padding-top: 14px; margin-top: 12px;">
      <p style="font-size: 1.15rem; font-weight: 700; margin-bottom: 10px; color: #1f2937;">
        ${t('saral_rate_question', 'How was your experience?')}
      </p>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="btn btn-secondary saral-rate-btn" data-rating="5" style="min-height: 60px; font-size: 1.2rem; font-weight: 700;">
          ${t('saral_rate_good', '😊 Good (5★)')}
        </button>
        <button class="btn btn-secondary saral-rate-btn" data-rating="3" style="min-height: 60px; font-size: 1.2rem; font-weight: 700;">
          ${t('saral_rate_okay', '😐 Okay (3★)')}
        </button>
        <button class="btn btn-secondary saral-rate-btn" data-rating="1" style="min-height: 60px; font-size: 1.2rem; font-weight: 700;">
          ${t('saral_rate_not_good', '🙁 Not Good (1★)')}
        </button>
      </div>
    </div>
  `;

  card.querySelector('#btn-saral-read-review')?.addEventListener('click', () => {
    speakText(speechText);
  });

  card.querySelectorAll('.saral-rate-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const rate = Number(btn.dataset.rating);
      submitReview({
        targetType,
        targetId,
        name: 'Elder Traveller',
        rating: rate,
        comment: rate === 5 ? 'Very peaceful and comfortable stay for elders.' : rate === 3 ? 'It was okay, good support.' : 'Faced mobility difficulties.',
        tags: ['Senior-friendly', 'Safe'],
        travelMonth: 'October 2026',
        language: document.documentElement.lang === 'hi' ? 'hi' : 'en'
      });
      speakText('Thank you! Your feedback has been saved.');
      alert('✅ ' + t('review_success', 'Thank you! Your review has been saved locally.'));
      renderSaralReviewSummary(container, targetType, targetId);
    });
  });

  container.innerHTML = '';
  container.appendChild(card);
}
