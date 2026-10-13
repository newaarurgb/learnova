function progressKey(user) {
  return `learnova_progress_${user.id ?? user.email}`;
}

export function getLearningProgress(user) {
  const raw = localStorage.getItem(progressKey(user));
  return raw ? JSON.parse(raw) : { completed: [], saved: [], notes: {} };
}

export function saveLearningProgress(user, progress) {
  localStorage.setItem(progressKey(user), JSON.stringify(progress));
}
