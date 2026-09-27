// ==UserScript==
// @name         学习通自动刷课脚本 V3 稳定版
// @namespace    local.codex.xuexitong
// @version      3.3.6
// @description  自动播放、自动切换下一节，并在页面结构异常时安全停止
// @author       Codex
// @match        *://mooc1.chaoxing.com/mycourse/studentstudy*
// @match        *://*.chaoxing.com/mycourse/studentstudy*
// @match        *://*.chaoxing.com/mooc2-ans/mycourse/studentstudy*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    const APP_KEY = '__xuexitongPlayerV3';
    const BOOT_TIMER_KEY = '__xuexitongPlayerV3BootTimer';

    const previousApp = window[APP_KEY];
    if (previousApp && typeof previousApp.destroy === 'function') {
        previousApp.destroy();
    }
    if (window[BOOT_TIMER_KEY]) {
        clearInterval(window[BOOT_TIMER_KEY]);
        window[BOOT_TIMER_KEY] = null;
    }


    function createStatusPanel() {
        document.getElementById('xuexitong-v3-status')?.remove();
        const host = document.createElement('div');
        host.id = 'xuexitong-v3-status';
        host.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:2147483647;max-width:calc(100vw - 36px)';
        const root = host.attachShadow({mode: 'open'});
        const style = document.createElement('style');
        style.textContent = `
            :host{color-scheme:light dark;--text:#202124;--muted:#626873;--glass:rgba(248,249,252,.91);--card:rgba(255,255,255,.68);--line:rgba(30,40,65,.10);--blue:#007aff;--green:#168447;--amber:#996200;--red:#cf3232;font:13px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text)}
            *{box-sizing:border-box}
            section{width:340px;max-width:calc(100vw - 36px);background:var(--glass);backdrop-filter:blur(24px) saturate(160%);-webkit-backdrop-filter:blur(24px) saturate(160%);border:1px solid var(--line);border-radius:20px;box-shadow:0 18px 60px rgba(25,35,55,.20),0 2px 8px rgba(25,35,55,.08),inset 0 1px 0 rgba(255,255,255,.65)}
            header{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 18px;border-bottom:1px solid var(--line);cursor:move;touch-action:none;user-select:none}
            header strong{font-size:13px;font-weight:600;letter-spacing:-.2px}
            header strong::before{content:'▶';display:inline-grid;place-items:center;width:26px;height:26px;margin-right:9px;border-radius:8px;background:linear-gradient(145deg,#54b4ff,#007aff);color:white;font-size:11px;box-shadow:0 2px 6px #007aff25}
            button,select,input{font:inherit}
            button{border:0;cursor:pointer;border-radius:10px;padding:7px 11px;transition:background .16s,transform .16s;color:var(--text);background:var(--card)}
            header button{font-size:12px;color:var(--muted);background:transparent}
            button:hover{filter:brightness(.96)}button:active{transform:scale(.98)}
            button:disabled,select:disabled{opacity:.45;cursor:default}
            button:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid #007aff60;outline-offset:3px}
            main{padding:16px 18px}
            p{margin:5px 0;overflow-wrap:anywhere}
            .status-card{border:1px solid var(--line);border-radius:14px;background:var(--card);padding:13px 14px;margin:13px 0 15px}
            .state{font-weight:600;font-size:14px;letter-spacing:-.2px}
            .detail{font-size:12px;color:var(--muted);margin-top:8px;line-height:1.65}
            .meta{color:var(--muted);font-size:11px;line-height:1.6}
            .switch-row,.speed-row{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:36px;font-weight:500}
            .switch-row{flex-direction:row-reverse;cursor:pointer}
            .master-row{font-size:14px}
            input[type=checkbox]{appearance:none;-webkit-appearance:none;flex:none;width:38px;height:23px;border-radius:20px;border:0;margin:0;background:#b8bec8;position:relative;cursor:pointer;transition:background .18s}
            input[type=checkbox]::after{content:'';position:absolute;width:19px;height:19px;top:2px;left:2px;border-radius:50%;background:white;box-shadow:0 1px 4px #0003;transition:transform .18s}
            input[type=checkbox]:checked{background:#34c759}input[type=checkbox]:checked::after{transform:translateX(15px)}
            select{border:1px solid var(--line);border-radius:9px;padding:6px 9px;background:var(--card);color:var(--text);cursor:pointer}
            .seek-row{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:12px;padding:13px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
            .seek-row>button{color:white;background:var(--blue);padding:9px 13px;flex:1;white-space:nowrap;box-shadow:0 2px 5px #007aff20}
            .seek-row>label{flex:1;min-width:125px;font-size:12px;gap:8px}
            .footer{margin-top:13px}.timestamp{font-size:10px;opacity:.85}
            [hidden]{display:none}
            @media(prefers-color-scheme:dark){:host{--text:#f1f2f6;--muted:#aeb4c0;--glass:rgba(35,38,46,.92);--card:rgba(255,255,255,.065);--line:rgba(255,255,255,.11);--blue:#0a84ff;--green:#6cdd97;--amber:#ffcd67;--red:#ff8a84}section{box-shadow:0 18px 60px #0006,inset 0 1px 0 #ffffff15}input[type=checkbox]{background:#626976}}
            @media(prefers-reduced-motion:reduce){button,input[type=checkbox],input[type=checkbox]::after{transition:none}}
        `;
        root.appendChild(style);
        const box = document.createElement('section');
        style.textContent += 'section{resize:both;overflow:auto;min-width:min(260px,calc(100vw - 36px));min-height:64px;max-height:calc(100vh - 12px)}';
        const header = document.createElement('header');
        const title = document.createElement('strong');
        title.textContent = '学习助手 · 3.3.6';
        title.title = '拖动标题移动面板；拖动面板右下角调整大小';
        let drag = null;
        header.addEventListener('pointerdown', event => {
            if (event.button !== 0 || event.target.tagName === 'BUTTON') return;
            const rect = host.getBoundingClientRect();
            drag = {id:event.pointerId,dx:event.clientX-rect.left,dy:event.clientY-rect.top};
            header.setPointerCapture(event.pointerId);
            event.preventDefault();
        });
        header.addEventListener('pointermove', event => {
            if (!drag || drag.id !== event.pointerId) return;
            const rect = host.getBoundingClientRect();
            host.style.left = Math.max(0, Math.min(window.innerWidth-rect.width,event.clientX-drag.dx)) + 'px';
            host.style.top = Math.max(0, Math.min(window.innerHeight-rect.height,event.clientY-drag.dy)) + 'px';
            host.style.right = 'auto';host.style.bottom = 'auto';
        });
        const endDrag = event => {
            if (drag?.id === event.pointerId) drag = null;
        };
        header.addEventListener('pointerup',endDrag);
        header.addEventListener('pointercancel',endDrag);
        header.addEventListener('lostpointercapture',endDrag);
        const toggle = document.createElement('button');
        toggle.textContent = '收起';
        toggle.setAttribute('aria-expanded','true');
        const body = document.createElement('main');
        toggle.addEventListener('click', () => {
            body.hidden = !body.hidden;
            toggle.textContent = body.hidden ? '展开' : '收起';
            toggle.setAttribute('aria-expanded', String(!body.hidden));
        });
        header.append(title,toggle);
        const state = document.createElement('p'); state.className = 'state';
        state.setAttribute('role','status');
        const detail = document.createElement('p');detail.className = 'detail';
        const progress = document.createElement('p'); progress.className = 'meta';
        const updated = document.createElement('p'); updated.className = 'meta timestamp';
        const speedLabel = document.createElement('label');
        speedLabel.className = 'speed-row';
        speedLabel.textContent = '播放倍速';
        const speed = document.createElement('select');
        speed.setAttribute('aria-label','播放倍速');
        for (const rate of [1,1.25,1.5,1.75,2]) {
            const option = document.createElement('option');
            option.value = String(rate); option.textContent = rate + '×';
            speed.appendChild(option);
        }
        speedLabel.appendChild(speed);
        const seek = document.createElement('button');
        seek.textContent = '跳到最后 1 分钟';
        const autoLabel = document.createElement('label');
        autoLabel.className = 'switch-row';
        const autoSeek = document.createElement('input');autoSeek.type = 'checkbox';
        autoSeek.setAttribute('aria-label','后续视频自动跳到最后一分钟');
        autoLabel.appendChild(autoSeek);
        const autoText = document.createElement('span');autoText.textContent = '后续自动跳转';
        autoLabel.appendChild(autoText);
        const seekRow = document.createElement('div');seekRow.className = 'seek-row';seekRow.append(seek,autoLabel);
        const enabledLabel = document.createElement('label');
        enabledLabel.className = 'switch-row master-row';
        const enabled = document.createElement('input');enabled.type = 'checkbox';
        enabled.setAttribute('aria-label','启用脚本');enabled.checked = true;
        const enabledText = document.createElement('span');enabledText.textContent = '启用脚本';
        enabledLabel.append(enabled,enabledText);
        const help = document.createElement('p');help.className = 'meta footer';
        help.textContent = '拖动标题移动 · 拖动右下角调整大小';
        const statusCard = document.createElement('div');statusCard.className = 'status-card';
        statusCard.append(state,detail,progress);
        body.append(enabledLabel,statusCard,speedLabel,seekRow,help,updated);
        box.append(header,body);root.appendChild(box);
        (document.body || document.documentElement).appendChild(host);
        let lastTime = null, lastMoved = Date.now(), timer = null, pendingSeek = null;
        const api = {
            set(message, level = 'info') {
                state.textContent = level === 'error' ? '● 已停止 / 需要检查' : level === 'warn' ? '● 等待 / 重试中' : '● 脚本运行中';
                state.style.color = level === 'error' ? 'var(--red)' : level === 'warn' ? 'var(--amber)' : 'var(--blue)';
                detail.textContent = message;
                updated.textContent = '最近动作：' + new Date().toLocaleTimeString();
            },
            seekToLastMinute(video) {
                if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
                    api.set('视频时长尚未加载，请稍后再试','warn');return false;
                }
                const target = Math.max(0,video.duration-60);
                try {
                    video.currentTime = target;
                    pendingSeek = {video,target,at:Date.now()};
                    api.set('已请求跳到最后 1 分钟，等待播放器确认；跳转不代表任务完成');
                    return true;
                } catch (error) {
                    api.set('播放器未接受进度跳转：' + error.message,'warn');return false;
                }
            },
            start(app) {
                if (timer) clearInterval(timer);
                try {
                    const saved = Number(localStorage.getItem('xuexitong-v3-playback-rate'));
                    if ([1,1.25,1.5,1.75,2].includes(saved)) app.configs.playbackRate = saved;
                    app._enabled = localStorage.getItem('xuexitong-v3-enabled') !== 'false';
                    app._autoLastMinute = localStorage.getItem('xuexitong-v3-auto-last-minute') === 'true';
                } catch (error) { /* Storage can be unavailable in restricted pages. */ }
                speed.value = String(app.configs.playbackRate);
                enabled.checked = app._enabled;
                autoSeek.checked = app._autoLastMinute;
                enabled.onchange = () => {
                    app.setEnabled(enabled.checked);
                    seek.disabled = !app._enabled;
                    speed.disabled = !app._enabled;
                    if (!app._enabled) pendingSeek = null;
                };
                autoSeek.onchange = () => {
                    app._autoLastMinute = autoSeek.checked;
                    // Switching this on applies to later videos, not the one already open.
                    if (autoSeek.checked && app._videoEl) app._autoSeeked.add(app._videoEl);
                    try {localStorage.setItem('xuexitong-v3-auto-last-minute',String(autoSeek.checked));} catch (error) {}
                    api.set(autoSeek.checked ? '后续视频将自动跳到最后 1 分钟' : '已关闭后续自动跳转');
                };
                seek.disabled = !app._enabled;
                speed.disabled = !app._enabled;
                seek.onclick = () => {
                    if (!app._enabled) return;
                    const video = app._getVideoEl();
                    api.seekToLastMinute(video);
                };
                speed.onchange = () => {
                    if (!app._enabled) return;
                    const rate = Number(speed.value);
                    if (![1,1.25,1.5,1.75,2].includes(rate)) return;
                    app.configs.playbackRate = rate;
                    const video = app._getVideoEl();
                    if (video) {
                        try {video.playbackRate = rate;}
                        catch (error) {api.set('播放器未接受倍速设置：' + error.message,'warn');return;}
                    }
                    try {localStorage.setItem('xuexitong-v3-playback-rate',String(rate));} catch (error) {}
                    api.set('已设置 ' + rate + ' 倍速' + (video ? '，当前实际倍速：' + video.playbackRate : '，下一段视频生效'));
                };
                timer = setInterval(() => {
                    const video = app._videoEl;
                    if (pendingSeek) {
                        if (video !== pendingSeek.video) {
                            pendingSeek = null;
                            api.set('视频已切换，原跳转请求已取消','warn');
                        } else if (!video.seeking && Math.abs(video.currentTime-pendingSeek.target) < 5) {
                            pendingSeek = null;
                            api.set('播放器已跳到最后 1 分钟；请核对平台任务完成状态');
                        } else if (Date.now()-pendingSeek.at >= 3000) {
                            pendingSeek = null;
                            api.set('进度跳转未生效，课程可能限制拖动进度','warn');
                        }
                    }
                    const current = Number(video?.currentTime || 0);
                    if (current !== lastTime) {lastTime = current;lastMoved = Date.now();}
                    const format = n => Number.isFinite(n) ? Math.floor(n/60) + ':' + String(Math.floor(n%60)).padStart(2,'0') : '--:--';
                    progress.textContent = (app.cellData.currentVideoTitle || '等待识别视频') + (video ? ' · ' + format(current) + ' / ' + format(video.duration) + ' · ' + video.playbackRate + '倍速' : '');
                    if (!app._enabled) {
                        state.textContent = '● 脚本已关闭';
                        state.style.color = 'var(--muted)';
                    } else if (app._isPlaying && video) {
                        const moving = !video.paused && !video.ended && Date.now()-lastMoved < app.configs.guardNoProgressMs;
                        state.textContent = moving ? '● 正在播放' : '● 视频暂停或卡住，尝试恢复';
                        state.style.color = moving ? 'var(--green)' : 'var(--amber)';
                    }
                    updated.textContent = '面板刷新：' + new Date().toLocaleTimeString();
                },1000);
            },
            destroy() {if(timer) clearInterval(timer);host.remove();}
        };
        api.set('已加载，等待课程目录');
        return api;
    }
    const statusPanel = createStatusPanel();

    let $ = window.jQuery;
    if (typeof window.jQuery === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
        script.type = 'text/javascript';
        script.onload = function () {
            $ = window.jQuery;
            if (typeof $ !== 'function') {
                statusPanel.set('播放依赖未就绪，请刷新页面', 'error');
                return;
            }
            console.log("jQuery loaded.");
            waitForCoursePage();
        };
        script.onerror = () => statusPanel.set('播放依赖加载失败，请检查网络后刷新页面', 'error');
        document.head.appendChild(script);
    } else {
        waitForCoursePage();
    }

    function waitForCoursePage() {
        let attempts = 0;
        const maxAttempts = 20;
        window[BOOT_TIMER_KEY] = setInterval(() => {
            if ($('#coursetree').length > 0) {
                clearInterval(window[BOOT_TIMER_KEY]);
                window[BOOT_TIMER_KEY] = null;
                initializePlayer();
                return;
            }
            attempts++;
            if (attempts >= maxAttempts) {
                clearInterval(window[BOOT_TIMER_KEY]);
                window[BOOT_TIMER_KEY] = null;
                statusPanel.set('启动超时：未找到课程目录，请确认处于课程播放页后刷新', 'error');
                console.error('%c脚本启动超时：未检测到课程目录（#coursetree）。请确认当前处于课程播放页。', 'color:#F44336;font-weight:bold');
            }
        }, 1000);
    }

    function initializePlayer() {
        const logger = {};
        for (const level of ['log','info','warn','error']) {
            logger[level] = (...args) => {
                console[level](...args);
                const message = typeof args[0] === 'string' ? args[0].replace(/%c/g,'').replace(/^=+|=+$/g,'').trim() : String(args[0]);
                if (!message) return;
                const reason = args.find(value => value instanceof Error);
                statusPanel.set(message + (reason ? '：' + reason.message : ''), level);
            };
        }
        const app = {
            _enabled: true,
            _autoLastMinute: false,
            _autoSeeked: new WeakSet(),
            _applyAutoLastMinute(video) {
                if (!this._enabled || !this._autoLastMinute || !video || this._autoSeeked.has(video)) return;
                if (!Number.isFinite(video.duration) || video.duration <= 0) return;
                // Attempt once per video so a platform restriction cannot create a seek loop.
                this._autoSeeked.add(video);
                statusPanel.seekToLastMinute(video);
            },
            setEnabled(enabled) {
                this._enabled = Boolean(enabled);
                try {localStorage.setItem('xuexitong-v3-enabled',String(this._enabled));} catch (error) {}
                if (!this._enabled) {
                    this._cancelPending();
                    this._isPlaying = false;
                    this._clearCheckInterval();
                    this._detachVideoEvents();
                    try {this._videoEl?.pause();} catch (error) {}
                    statusPanel.set('脚本已关闭，自动播放和章节切换已停止');
                } else {
                    try {this.run();}
                    catch (error) {statusPanel.set('启动失败：' + error.message,'error');}
                }
            },
            configs: {
                playbackRate: 1.5,
                autoplay: true,
                retryInterval: 2000,
                maxRetries: 10,
                videoCheckInterval: 1000,
                guardNoProgressMs: 7000,
                guardResumeCooldownMs: 1500,
                autoAdvanceNoVideo: false,
            },
            _videoEl: null,
            _treeContainerEl: null,
            _isPlaying: false,
            _currentRetryCount: 0,
            _checkInterval: null,
            _eventVideoEl: null,
            _boundVideoHandlers: null,
            _nextUnitPending: false,
            _chapterAdvanceTimes: 0,
            _cellData: {
                cells: 0,
                nCells: 0,
                currentCellIndex: 0,
                currentNCellIndex: 0,
                currentVideoTitle: "",
            },
            get cellData() {
                return this._cellData;
            },
            _timers: new Set(),
            _generation: 0,
            _schedule(callback, delay) {
                const generation = this._generation;
                const timer = setTimeout(() => {
                    this._timers.delete(timer);
                    if (generation === this._generation) callback();
                }, delay);
                this._timers.add(timer);
                return timer;
            },
            _cancelPending() {
                this._generation++;
                for (const timer of this._timers) clearTimeout(timer);
                this._timers.clear();
                this._delayedNextUnitTimer = null;
            },
            run() {
                if (!this._enabled) return;
                this._cancelPending();
                this._detachVideoEvents();
                this._isPlaying = false;
                this._tryTimes = 0;
                this._stepAdvanceTimes = 0;
                this._stepSwitchPending = false;
                this._treeContainerEl = null;
                logger.log("%c=== 学习通自动刷课脚本 V3 优化版启动 ===", "color:#4CAF50;font-size:16px;font-weight:bold");
                this._nextUnitPending = false;
                this._chapterAdvanceTimes = 0;
                this._getTreeContainer();
                this._initCellData();
                this._videoEl = null;
                this._getVideoEl();
                this._clearCheckInterval();
                this._bindStepNavigation();
                this.play();
            },
            nextUnit() {
                if (!this._enabled) return;
                if (this._nextUnitPending) {
                    logger.warn('%c已有小节切换正在进行，忽略重复请求', 'color:#FF9800');
                    return;
                }
                this._nextUnitPending = true;
                this._clearCheckInterval();
                logger.log("%c=== 准备切换到下一小节 ===", "color:#2196F3;font-size:14px");
                try {
                    const el = this._getTreeContainer();
                    const cells = el.children("ul").children("li");
                    const nCells = $(cells.get(this._cellData.currentCellIndex)).find('.posCatalog_select:not(.firstLayer)');

                    if (nCells.length > this._cellData.currentNCellIndex + 1) {
                        const nextNIndex = this._cellData.currentNCellIndex + 1;
                        logger.log(`%c切换到同章节下一个视频: ${nextNIndex + 1}/${nCells.length}`, "color:#FF9800");
                        this.playCurrentIndex(nCells.get(nextNIndex));
                    } else {
                        const nextIndex = this._cellData.currentCellIndex + 1;
                        if (nextIndex >= cells.length) {
                            logger.log("%c=====================================", "color:#4CAF50;font-size:16px");
                            logger.log("%c==============已到课程目录末尾，请核对平台任务完成状态==============", "color:#4CAF50;font-size:16px;font-weight:bold");
                            logger.log("%c=====================================", "color:#4CAF50;font-size:16px");
                            return;
                        }
                        logger.log(`%c切换到下一个章节: ${nextIndex + 1}/${cells.length}`, "color:#FF9800");
                        this._cellData.currentCellIndex = nextIndex;
                        this._cellData.currentNCellIndex = 0;
                        this.playCurrentIndex();
                    }
                } catch (error) {
                    this._nextUnitPending = false;
                    logger.error('切换下一小节失败:', error);
                }
            },
            _clearCheckInterval() {
                if (this._checkInterval) {
                    clearInterval(this._checkInterval);
                    this._checkInterval = null;
                }
            },
            _startVideoMonitoring() {
                this._clearCheckInterval();
                this._guardLastTime = 0;
                this._guardLastWallTs = 0;
                this._guardLastResumeTs = 0;
                this._checkInterval = setInterval(() => {
                    this._checkVideoStatus();
                }, this.configs.videoCheckInterval);
            },
            _tryResumePlayback(reason) {
                if (!this._enabled) return;
                const generation = this._generation;
                const now = Date.now();
                if (now - this._guardLastResumeTs < this.configs.guardResumeCooldownMs) {
                    return;
                }
                this._guardLastResumeTs = now;

                const video = this._getVideoEl();
                if (!video || !this._isPlaying) return;

                logger.log(`%c触发视频保活恢复(${reason})`, "color:#607D8B");
                video.play().catch((e) => {
                    if (!this._enabled || generation !== this._generation) return;
                    logger.warn("直接恢复播放失败，尝试静音恢复:", e);
                    video.muted = true;
                    video.play().catch((err) => {
                        logger.error("静音恢复播放失败:", err);
                    });
                });
            },
            _checkVideoStatus() {
                if (!this._enabled) return;
                try {
                    const video = this._getVideoEl();
                    if (!video) return;
                    this._applyAutoLastMinute(video);

                    if (video.paused && this._isPlaying) {
                        logger.log("%c检测到视频暂停，尝试恢复播放...", "color:#FF5722");
                        this._tryResumePlayback("paused");
                    } else if (this._isPlaying && !video.ended) {
                        const now = Date.now();
                        const current = Number(video.currentTime || 0);
                        if (this._guardLastWallTs === 0) {
                            this._guardLastWallTs = now;
                            this._guardLastTime = current;
                        } else {
                            const stalled = Math.abs(current - this._guardLastTime) < 0.01;
                            const stalledMs = now - this._guardLastWallTs;
                            if (stalled && stalledMs >= this.configs.guardNoProgressMs) {
                                this._tryResumePlayback("no-progress");
                                this._guardLastWallTs = now;
                                this._guardLastTime = Number(video.currentTime || 0);
                            } else if (!stalled) {
                                this._guardLastWallTs = now;
                                this._guardLastTime = current;
                            }
                        }
                    }

                    if (video.ended && this._isPlaying) {
                        logger.log("%c检测到视频结束，准备切换下一个...", "color:#9C27B0");
                        this._isPlaying = false;
                        this._schedule(() => this.nextUnit(), 1000);
                    }
                } catch (e) {
                    logger.error("视频状态检查失败:", e);
                }
            },
            _tryTimes: 0,
            _stepAdvanceTimes: 0,
            _stepSwitchAt: 0,
            _stepSwitchPending: false,
            _delayedNextUnitTimer: null,
            _guardLastTime: 0,
            _guardLastWallTs: 0,
            _guardLastResumeTs: 0,
            async play() {
                if (!this._enabled) return;
                const generation = this._generation;
                try {
                    const el = this._getVideoEl();
                    if (el == null) {
                        if (this._currentStepTitle() === '视频') {
                            throw new Error('视频组件尚未加载完成');
                        }
                        if (this._advanceLearningStep()) {
                            logger.log("%c当前不在视频页，已尝试切到下一学习步骤，2秒后重试", "color:#607D8B");
                            this._schedule(() => {
                                this.play();
                            }, 2000);
                            return;
                        }
                        if (this._isChapterTest()) {
                            this._advanceChapterTest();
                            return;
                        }
                        this._isPlaying = false;
                        this._clearCheckInterval();
                        if (this.configs.autoAdvanceNoVideo) {
                            logger.warn('%c当前小节未发现视频，按配置切换到下一小节', 'color:#FF9800');
                            this.nextUnit();
                        } else {
                            logger.warn('%c当前小节未发现视频或可识别的学习步骤，已安全停止。确认无需完成课件后，可执行 app.nextUnit()。', 'color:#FF9800');
                        }
                        return;
                    }

                    this._isPlaying = true;
                    this._videoEventHandle();
                    this._applyAutoLastMinute(el);
                    el.playbackRate = this.configs.playbackRate;

                    try {
                        await el.play();
                        if (generation !== this._generation) return;
                        this._tryTimes = 0;
                        logger.log(`%c视频开始播放，倍速: ${el.playbackRate}x`, "color:#4CAF50");
                        this._startVideoMonitoring();
                    } catch (playError) {
                        if (generation !== this._generation) return;
                        logger.error("视频播放失败:", playError);
                        this._handlePlayError(playError);
                    }
                } catch (e) {
                    if (this._tryTimes >= this.configs.maxRetries) {
                        logger.error("%c视频播放失败，已达到最大重试次数", "color:#F44336;font-weight:bold", e);
                        this._clearCheckInterval();
                        return;
                    }
                    this._tryTimes++;
                    logger.log(`%c播放失败，${this.configs.retryInterval/1000}秒后重试 (${this._tryTimes}/${this.configs.maxRetries})`, "color:#FF9800");
                    this._schedule(() => {
                        this.play();
                    }, this.configs.retryInterval);
                }
            },
            _advanceLearningStep() {
                if (this._stepSwitchPending && Date.now() - this._stepSwitchAt < 4000) {
                    return true;
                }

                const prevTitle = document.getElementsByClassName("prev_title")[0];
                const currentStepTitle = prevTitle ? (prevTitle.title || prevTitle.textContent || "").trim() : "";

                if (currentStepTitle === "章节测验" || currentStepTitle === "视频") {
                    return false;
                }

                if (this._stepAdvanceTimes >= this.configs.maxRetries) {
                    logger.error('视频页签切换多次失败，已停止。请手动进入视频页后重新运行。');
                    return false;
                }
                const clickElement = (el, label) => {
                    if (!el) return false;
                    this._stepAdvanceTimes++;
                    this._stepSwitchPending = true;
                    this._stepSwitchAt = Date.now();
                    logger.log(`%c尝试点击${label}`, "color:#2196F3");
                    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
                    return true;
                };

                const videoTab = $(".prev_white:visible").filter((_, el) => {
                    const text = ($(el).text() || "").replace(/\s+/g, "");
                    return /^\d*视频$/.test(text);
                }).get(0);
                if (clickElement(videoTab, "“视频”页签")) {
                    return true;
                }

                return false;
            },
            _currentStepTitle() {
                const prevTitle = document.getElementsByClassName('prev_title')[0];
                return prevTitle ? (prevTitle.title || prevTitle.textContent || '').trim() : '';
            },
            _isChapterTest() {
                return this._currentStepTitle() === '章节测验';
            },
            _advanceChapterTest() {
                if (this._chapterAdvanceTimes >= 3) {
                    logger.error('%c章节测验页面连续跳转失败，已停止以避免页面循环。请手动处理后执行 app.run()。', 'color:#F44336;font-weight:bold');
                    return;
                }

                const nextButton = $('#prevNextFocusNext:visible, #right1:visible, .nextChapter:visible').first().get(0);
                if (!nextButton) {
                    logger.warn('%c未找到章节测验的下一步按钮，已停止。', 'color:#FF9800');
                    return;
                }

                this._chapterAdvanceTimes++;
                logger.log('%c检测到章节测验，尝试进入下一学习步骤', 'color:#607D8B');
                nextButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                this._schedule(() => this.play(), 2000);
            },
            _bindStepNavigation() {
                if (this._stepNavigationBound) {
                    return;
                }
                this._stepNavigationBound = true;

                const reenterVideoMode = () => {
                    if (!this._enabled) return;
                    this._cancelPending();
                    this._clearCheckInterval();
                    this._detachVideoEvents();
                    this._videoEl = null;
                    this._isPlaying = false;
                    this._stepSwitchPending = true;
                    this._stepSwitchAt = Date.now();
                    this._schedule(() => {
                        try {
                            this._initCellData();
                        } catch (e) {
                            logger.error('无法确定当前课程节点，已停止:', e);
                            return;
                        }
                        this.play();
                    }, 1800);
                };

                $(document).off('click.xuexitongPlayerV3', '.prev_white').on('click.xuexitongPlayerV3', '.prev_white', (e) => {
                    const text = ($(e.currentTarget).text() || "").replace(/\s+/g, "");
                    if (text.includes("视频")) {
                        logger.log(`%c检测到步骤切换点击：${text}，准备重新接管视频页`, "color:#607D8B");
                        reenterVideoMode();
                    }
                });
            },
            _handlePlayError(error) {
                logger.error("播放错误详情:", error);
                const generation = this._generation;
                const video = this._getVideoEl();
                if (video) {
                    video.muted = true;
                    video.play().then(() => {
                        if (generation !== this._generation) return;
                        logger.log("%c静音播放成功", "color:#4CAF50");
                        this._tryTimes = 0;
                        this._startVideoMonitoring();
                        if (this._delayedNextUnitTimer) {
                            clearTimeout(this._delayedNextUnitTimer);
                            this._delayedNextUnitTimer = null;
                        }
                    }).catch(e => {
                        if (generation !== this._generation) return;
                        logger.error("静音播放也失败:", e);
                        if (this._delayedNextUnitTimer) {
                            clearTimeout(this._delayedNextUnitTimer);
                        }
                        this._isPlaying = false;
                        if (this._tryTimes >= this.configs.maxRetries) {
                            logger.error('%c静音播放失败，已达到最大重试次数', 'color:#F44336;font-weight:bold', e);
                            return;
                        }
                        this._tryTimes++;
                        this._delayedNextUnitTimer = this._schedule(() => {
                            this._delayedNextUnitTimer = null;
                            this.play();
                        }, this.configs.retryInterval);
                    });
                }
            },
            playCurrentIndex(nCell) {
                if (!this._enabled) return;
                this._cancelPending();
                this._detachVideoEvents();
                this._clearCheckInterval();
                this._tryTimes = 0;
                this._stepAdvanceTimes = 0;
                this._stepSwitchPending = false;
                this._nextUnitPending = false;
                if (!nCell) {
                    const el = this._getTreeContainer();
                    const cells = el.children("ul").children("li");
                    const nCells = $(cells.get(this._cellData.currentCellIndex)).find('.posCatalog_select:not(.firstLayer)');
                    nCell = nCells.get(this._cellData.currentNCellIndex);
                }

                const $nCell = $(nCell);
                const clickableSpan = $nCell.find(".posCatalog_name")[0];
                if (!clickableSpan) {
                    logger.error("%c===========找不到可点击的课程节点，播放下一个视频失败==============", "color:#F44336");
                    return;
                }

                logger.log(`%c点击切换到: ${$(clickableSpan).attr('title') || '未知标题'}`, "color:#2196F3");
                $(clickableSpan).click();
                this._videoEl = null;
                this._isPlaying = false;

                logger.log("%c等待视频加载...", "color:#FF9800");
                this._schedule(() => {
                    try {
                        this._initCellData();
                    } catch (error) {
                        logger.error('课程切换后无法确定当前节点，已停止:', error);
                        return;
                    }
                    if (this.configs.autoplay) {
                        this.play();
                    }
                }, 3000);
            },
            _initCellData() {
                const el = this._getTreeContainer();
                const cells = el.children("ul").children("li");
                this._cellData.cells = cells.length;
                let nCellCounts = 0;
                let foundCurrent = false;

                cells.each((i, v) => {
                    const nCells = $(v).find('.posCatalog_select:not(.firstLayer)');
                    nCellCounts += nCells.length;
                    nCells.each((j, e) => {
                        const _el = $(e);
                        if (_el.hasClass("posCatalog_active")) {
                            this._cellData.currentCellIndex = i;
                            this._cellData.currentNCellIndex = j;
                            foundCurrent = true;
                            const titleSpan = _el.find('.posCatalog_name')[0];
                            if (titleSpan) {
                                this._cellData.currentVideoTitle = $(titleSpan).attr('title');
                            }
                        }
                    });
                });

                this._cellData.nCells = nCellCounts;

                if (!foundCurrent && nCellCounts > 0) {
                    throw new Error("未找到当前选中的课程节点，已停止。请手动选择视频后执行 app.run()。");
                }

                logger.log(`%c课程信息: ${this._cellData.cells}章, ${this._cellData.nCells}节, 当前: 第${this._cellData.currentCellIndex + 1}章第${this._cellData.currentNCellIndex + 1}节`, "color:#607D8B");
            },
            _getTreeContainer() {
                if (!this._treeContainerEl) {
                    const el = $('#coursetree');
                    if (el.length <= 0) {
                        throw new Error("找不到视频列表");
                    }
                    this._treeContainerEl = el;
                }
                return this._treeContainerEl;
            },
            _getVideoEl() {
                if (this._videoEl && !this._videoEl.isConnected) this._videoEl = null;
                if (!this._videoEl) {
                    try {
                        const findVideo = (frame, depth) => {
                            if (depth > 2) return null;
                            try {
                            const frameDocument = frame.contentDocument || frame.contentWindow?.document;
                            if (!frameDocument) return null;
                            const $frameDocument = $(frameDocument);
                            const directVideo = $frameDocument.find('video#video_html5_api, video[id*="video_html5"]').get(0);
                            if (directVideo) return directVideo;

                            const nestedFrames = $frameDocument.find('iframe.ans-insertvideo-online, iframe[src*="video"]');
                            for (const nestedFrame of nestedFrames.toArray()) {
                                const nestedVideo = findVideo(nestedFrame, depth + 1);
                                if (nestedVideo) return nestedVideo;
                            }
                            return null;
                            } catch (error) {
                                // An inaccessible frame must not prevent checking its siblings.
                                return null;
                            }
                        };

                        for (const frame of $('iframe').toArray()) {
                            const video = findVideo(frame, 0);
                            if (video) {
                                this._videoEl = video;
                                break;
                            }
                        }
                    } catch (e) {
                        logger.error("获取视频元素失败:", e);
                        return null;
                    }
                }
                if (!this._videoEl) return null;
                return this._videoEl;
            },
            _videoEventHandle() {
                const el = this._videoEl;
                if (!el) {
                    logger.log("videoEl未加载");
                    return;
                }

                if (this._eventVideoEl === el) return;
                this._detachVideoEvents();
                this._eventVideoEl = el;
                this._boundVideoHandlers = {
                    ended: this._handleVideoEnded.bind(this),
                    loadedmetadata: this._handleVideoLoaded.bind(this),
                    play: this._handleVideoPlay.bind(this),
                    pause: this._handleVideoPause.bind(this),
                };

                el.addEventListener('ended', this._boundVideoHandlers.ended);
                el.addEventListener('loadedmetadata', this._boundVideoHandlers.loadedmetadata);
                el.addEventListener('play', this._boundVideoHandlers.play);
                el.addEventListener('pause', this._boundVideoHandlers.pause);
            },
            _detachVideoEvents() {
                if (!this._eventVideoEl || !this._boundVideoHandlers) return;
                this._eventVideoEl.removeEventListener('ended', this._boundVideoHandlers.ended);
                this._eventVideoEl.removeEventListener('loadedmetadata', this._boundVideoHandlers.loadedmetadata);
                this._eventVideoEl.removeEventListener('play', this._boundVideoHandlers.play);
                this._eventVideoEl.removeEventListener('pause', this._boundVideoHandlers.pause);
                this._eventVideoEl = null;
                this._boundVideoHandlers = null;
            },
            _handleVideoEnded(e) {
                if (!this._enabled) return;
                const title = this._cellData.currentVideoTitle;
                logger.warn(`%c============'${title}' 播放完成=============`, "color:#4CAF50;font-weight:bold");
                this._isPlaying = false;
                this._clearCheckInterval();
                this._schedule(() => this.nextUnit(), 1000);
            },
            _handleVideoLoaded(e) {
                if (!this._enabled) return;
                this._applyAutoLastMinute(this._getVideoEl());
                logger.log(`%c============视频加载完成=============`, "color:#2196F3");
                if (this.configs.autoplay && !this._isPlaying) {
                    this.play();
                }
            },
            _handleVideoPlay(e) {
                if (!this._enabled) return;
                this._chapterAdvanceTimes = 0;
                this._stepAdvanceTimes = 0;
                this._tryTimes = 0;
                const title = this._cellData.currentVideoTitle;
                logger.info(`%c============'${title}' 开始播放=============`, "color:#4CAF50");
                this._isPlaying = true;
                this._stepSwitchPending = false;
                const video = this._getVideoEl();
                this._guardLastTime = Number(video?.currentTime || 0);
                this._guardLastWallTs = Date.now();
                if (this._delayedNextUnitTimer) {
                    clearTimeout(this._delayedNextUnitTimer);
                    this._delayedNextUnitTimer = null;
                }
            },
            _handleVideoPause(e) {
                logger.log(`%c============视频暂停=============`, "color:#FF9800");
            },
            _bindPageGuards() {
                const preventPause = (e) => {
                    if (!this._enabled) return;
                    e.stopPropagation();
                    e.preventDefault();
                };
                const resumePlaybackNow = () => this._tryResumePlayback('page-event');
                this._pageGuards = { preventPause, resumePlaybackNow };
                document.addEventListener('mouseleave', preventPause);
                window.addEventListener('mouseleave', preventPause);
                document.addEventListener('mouseout', preventPause);
                window.addEventListener('mouseout', preventPause);
                window.addEventListener('blur', resumePlaybackNow);
                document.addEventListener('visibilitychange', resumePlaybackNow);
            },
            destroy() {
                statusPanel.destroy();
                this._cancelPending();
                this._isPlaying = false;
                this._clearCheckInterval();
                this._detachVideoEvents();
                if (this._delayedNextUnitTimer) clearTimeout(this._delayedNextUnitTimer);
                $(document).off('.xuexitongPlayerV3');
                if (this._pageGuards) {
                    const { preventPause, resumePlaybackNow } = this._pageGuards;
                    document.removeEventListener('mouseleave', preventPause);
                    window.removeEventListener('mouseleave', preventPause);
                    document.removeEventListener('mouseout', preventPause);
                    window.removeEventListener('mouseout', preventPause);
                    window.removeEventListener('blur', resumePlaybackNow);
                    document.removeEventListener('visibilitychange', resumePlaybackNow);
                    this._pageGuards = null;
                }
            },
        };

        statusPanel.start(app);
        window.app = app;
        window[APP_KEY] = app;

        try {
            if (app._enabled) app.run();
            else statusPanel.set('脚本已关闭，打开“启用脚本”开关后运行');
            app._bindPageGuards();
        } catch (error) {
            logger.error("%c脚本运行失败: ", "color:#F44336;font-weight:bold", error.message);
            logger.log("请检查是否在正确的课程播放页面，或者页面结构是否再次发生改变。");
        }
    }
})();
