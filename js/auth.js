// â•â•â•â• AUTH â•â•â•â•
// Security is enforced server-side by Firestore rules (see firestore.rules).
// Client only checks whether a user is signed in at all.
const _auth = firebase.auth();

// Complete pending redirect sign-in (iOS PWA standalone mode)
_auth.getRedirectResult().catch(() => {});

_auth.onAuthStateChanged(user => {
  const shell = document.getElementById('app-shell');
  const loginScreen = document.getElementById('login-screen');
  if (user) {
    loginScreen.style.display = 'none';
    shell.style.display = '';
    const nameEl = document.getElementById('user-name');
    const emailEl = document.getElementById('user-email');
    const initialsEl = document.getElementById('user-initials');
    const photoEl = document.getElementById('user-photo');
    if (nameEl) nameEl.textContent = user.displayName || user.email;
    if (emailEl) emailEl.textContent = user.displayName ? user.email : '';
    if (initialsEl) {
      const name = user.displayName || user.email || '?';
      initialsEl.textContent = name.split(/[\s@]/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');
    }
    if (photoEl && user.photoURL) {
      photoEl.src = user.photoURL;
      photoEl.style.display = 'block';
      const init = document.getElementById('user-initials');
      if (init) init.style.display = 'none';
    }
    loadLocal(); renderAll(); renderLookupUI();
    connectAndLoad();
  } else {
    shell.style.display = 'none';
    loginScreen.style.display = '';
  }
});

document.getElementById('google-sign-in-btn').addEventListener('click', () => {
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';
  const provider = new firebase.auth.GoogleAuthProvider();
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isStandalone) {
    _auth.signInWithRedirect(provider);
  } else {
    _auth.signInWithPopup(provider).catch(err => {
      errEl.textContent = err.message;
      errEl.style.display = '';
    });
  }
});

function signOut() { _auth.signOut(); }
function toggleUserDropdown(){
  const dd=document.getElementById('userDropdown');
  dd.classList.toggle('open');
}
// Close dropdown when clicking outside
document.addEventListener('click',function(e){
  const wrap=document.getElementById('userAvatarWrap');
  if(wrap && !wrap.contains(e.target)){
    const dd=document.getElementById('userDropdown');
    if(dd) dd.classList.remove('open');
  }
});

