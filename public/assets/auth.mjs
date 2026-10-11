const $=s=>document.querySelector(s),params=new URLSearchParams(location.search);
let mode=['register','link','recover'].includes(params.get('mode'))?params.get('mode'):'login',busy=false,config={};
function returnPath(){try{const url=new URL(params.get('return_to')||'/profile.html',location.origin);return url.origin===location.origin&&!/^\/(auth\.html|api\/|signin-with-chatgpt|signout-with-chatgpt)/.test(url.pathname)?url.pathname+url.search+url.hash:'/profile.html'}catch{return '/profile.html'}}
async function api(path,options={}){const response=await fetch('/api/'+path,{...options,cache:'no-store',headers:{'Content-Type':'application/json',...options.headers}}),data=await response.json();if(!response.ok)throw new Error(data.error||'Не удалось войти.');return data}
function switchMode(value){if(busy)return;mode=value;draw();$('#auth-title').focus()}
function draw(){
 $('#auth-error').textContent='';
 const register=mode==='register',link=mode==='link',recover=mode==='recover',newPassword=register||link||recover;
 if(link&&!config.canLinkLegacy){
  $('#auth-body').innerHTML='<span class="tag">Прежний аккаунт</span><h2 id="auth-title" tabindex="-1">Сохраним ваши данные</h2><p id="legacy-message"></p><a class="primary" id="legacy-signin" target="_top">Подтвердить прежний аккаунт →</a><button class="text-button" id="back-login">Вернуться к обычному входу</button>';
  $('#legacy-message').textContent=config.hasPasswordSession?'Сначала выйдите из текущего аккаунта через личный кабинет. После этого можно подключить пароль к прежнему аккаунту.':config.legacyUsername?'К прежнему аккаунту уже подключён логин «'+config.legacyUsername+'». Вернитесь ко входу и введите пароль.':'Один раз подтвердите аккаунт, которым пользовались раньше. Затем задайте логин и пароль — профиль, бизнесы и права останутся у вас.';
  $('#legacy-signin').hidden=Boolean(config.legacyUsername||config.hasPasswordSession);$('#legacy-signin').href='/signin-with-chatgpt?return_to='+encodeURIComponent('/auth.html?mode=link&return_to='+encodeURIComponent(returnPath()));$('#back-login').onclick=()=>switchMode('login');return;
 }
 const title=register?'Давайте знакомиться':link?'Подключите обычный вход':recover?'Восстановить доступ':'С возвращением';
 const submit=register?'Создать аккаунт':link?'Сохранить логин и пароль':recover?'Установить новый пароль':'Войти';
 $('#auth-body').innerHTML=`<span class="tag">Личный кабинет</span><h2 id="auth-title" tabindex="-1">${title}</h2><p>${register?'Ваш собственный аккаунт в Аркантериуме.':link?'Ваши материалы и права сохранятся. В следующий раз достаточно логина и пароля.':recover?'Введите резервный код, который вы сохранили при создании аккаунта.':'Войдите по своему логину и паролю.'}</p><form id="auth-form">
 ${register||link?'<label for="auth-name">Ваше имя</label><input id="auth-name" name="name" required minlength="2" maxlength="60" autocomplete="name" placeholder="Как к вам обращаться?">':''}
 <label for="auth-username">Логин</label><input id="auth-username" name="username" required minlength="3" maxlength="32" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Например, insaf">
 ${recover?'<label for="recovery-code">Резервный код</label><input id="recovery-code" name="recoveryCode" required maxlength="100" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Код из сохранённого файла">':''}
 <label for="auth-password">${recover?'Новый пароль':'Пароль'}</label><div class="password-row"><input id="auth-password" name="password" type="password" required ${newPassword?'minlength="15"':''} maxlength="128" autocomplete="${newPassword?'new-password':'current-password'}" placeholder="${newPassword?'Не меньше 15 символов':'Ваш пароль'}"><button type="button" id="show-password" aria-label="Показать пароль" aria-pressed="false">Показать</button></div>
 ${newPassword?'<label for="auth-confirm">Повторите пароль</label><input id="auth-confirm" type="password" required minlength="15" maxlength="128" autocomplete="new-password"><p class="auth-hint">Пароль можно составить из нескольких слов. Логин: буквы, цифры и знак _.</p>':''}
 <button class="primary" type="submit">${submit}</button></form>
 <p class="auth-switch">${mode==='login'?'Впервые здесь?':'Уже есть аккаунт?'} <button class="text-button" id="switch-mode">${mode==='login'?'Создать аккаунт':'Войти'}</button></p>
 ${mode==='login'?(config.recovery?'<button class="text-button" id="recover-account">Забыли пароль?</button>':'<p class="auth-hint">Забыли пароль? Обратитесь к администратору сайта.</p>')+(config.legacySupported?'<details class="legacy-details"><summary>Уже пользовались прежней версией?</summary><p>Подключите логин и пароль к прежнему аккаунту, чтобы сохранить все материалы.</p><button class="text-button" id="link-account">Подключить прежний аккаунт →</button></details>':''):''}`;
 $('#auth-error').textContent='';$('#switch-mode').onclick=()=>switchMode(mode==='login'?'register':'login');
 if($('#recover-account'))$('#recover-account').onclick=()=>switchMode('recover');if($('#link-account'))$('#link-account').onclick=()=>switchMode('link');
 $('#show-password').onclick=()=>{const input=$('#auth-password'),show=input.type==='password';input.type=show?'text':'password';if($('#auth-confirm'))$('#auth-confirm').type=input.type;$('#show-password').textContent=show?'Скрыть':'Показать';$('#show-password').setAttribute('aria-pressed',String(show));$('#show-password').setAttribute('aria-label',show?'Скрыть пароль':'Показать пароль')};
 if(newPassword)for(const input of [$('#auth-password'),$('#auth-confirm')])input.addEventListener('input',()=>$('#auth-confirm').setCustomValidity(''));
 $('#auth-form').onsubmit=async event=>{
  event.preventDefault();if(busy)return;
  if(newPassword&&$('#auth-confirm').value!==$('#auth-password').value){$('#auth-confirm').setCustomValidity('Пароли не совпадают.');$('#auth-confirm').reportValidity();return}
  busy=true;const button=event.target.querySelector('[type=submit]');button.disabled=true;button.textContent='Подождите…';$('#auth-error').textContent='';
  try{const result=await api('auth/'+mode,{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(event.target)))});if(result.recoveryCode)showRecovery(result);else location.assign(returnPath())}catch(error){$('#auth-error').textContent=error.message}finally{busy=false;button.disabled=false;button.textContent=submit}
 };
}
function showRecovery({username,recoveryCode}){
 $('#auth-error').textContent='';$('#auth-body').innerHTML='<span class="tag">Аккаунт готов</span><h2 id="auth-title" tabindex="-1">Сохраните резервный код</h2><p>Он поможет вернуть доступ, если вы забудете пароль. Код показывается один раз. Храните его у себя и никому не передавайте.</p><label for="saved-login">Ваш логин</label><input id="saved-login" readonly><label for="saved-code">Резервный код</label><textarea id="saved-code" readonly rows="3" spellcheck="false"></textarea><button class="secondary" id="download-code">Скачать код в файл</button><label class="recovery-saved"><input type="checkbox" id="code-kept"> Я сохранил логин и резервный код</label><button class="primary" id="continue-account" disabled>Перейти в личный кабинет →</button>';
 $('#saved-login').value=username;$('#saved-code').value=recoveryCode;$('#auth-title').focus();
 $('#download-code').onclick=()=>{const blob=new Blob(['Аркантериум\nАдрес: '+location.origin+'\nЛогин: '+username+'\nРезервный код: '+recoveryCode+'\n\nХраните этот файл в безопасном месте. Код даёт доступ к вашему аккаунту. После восстановления сохраните новый код.\n'],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Arkanterium-Recovery.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 $('#code-kept').onchange=()=>$('#continue-account').disabled=!$('#code-kept').checked;$('#continue-account').onclick=()=>location.assign(returnPath());
}
try{
 if(params.get('mode')==='logout'){const result=await api('auth/logout',{method:'POST',body:'{}'});location.replace(result.redirect==='/signout-with-chatgpt?return_to=%2F'?result.redirect:'/')}
 else{config=await api('auth/config');if(mode==='link'&&!config.legacySupported||mode==='recover'&&!config.recovery)mode='login';const {user}=await api('me');if(user&&mode==='login'&&!config.canLinkLegacy)location.replace(returnPath());else{if(user&&config.canLinkLegacy&&mode==='login')mode='link';draw()}}
}catch(error){$('#auth-title').textContent='Вход временно недоступен';$('#auth-error').textContent=error.message}
