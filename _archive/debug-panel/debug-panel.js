// ── DEBUG PANEL — INIT HOOK ──
// Place at the end of init(), just before the closing brace:
//   try{ if(location.search.includes('debug')) initDebugPanel(); }catch(e){}

// ── DEBUG PANEL START ──
function initDebugPanel(){
  if(!location.search.includes('debug')) return;
  try{

    // ── Toggle pill ──
    const toggle = document.createElement('button');
    toggle.id = 'dbg-toggle';
    toggle.textContent = '🛠 Debug';
    document.body.appendChild(toggle);

    // ── Panel shell ──
    const panel = document.createElement('div');
    panel.id = 'dbg-panel';
    panel.classList.add('dbg-hidden');
    panel.innerHTML =
      '<div class="dbg-header">' +
        '<span class="dbg-title">Folio DevTools</span>' +
        '<button class="dbg-close" id="dbg-close-btn">✕</button>' +
      '</div>' +
      '<div class="dbg-tabs">' +
        '<button class="dbg-tab active" data-tab="fixture">Fixture</button>' +
        '<button class="dbg-tab" data-tab="stepper">Stepper</button>' +
        '<button class="dbg-tab" data-tab="state">State</button>' +
        '<button class="dbg-tab" data-tab="persist">Persist</button>' +
        '<button class="dbg-tab" data-tab="tests">Tests</button>' +
      '</div>' +
      '<div class="dbg-body" id="dbg-body"></div>';
    document.body.appendChild(panel);

    let activeTab = 'fixture';
    let stateInterval = null;

    // ── Tab switching ──
    panel.querySelectorAll('.dbg-tab').forEach(function(btn){
      btn.addEventListener('click', function(){
        panel.querySelectorAll('.dbg-tab').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        activeTab = btn.dataset.tab;
        if(activeTab !== 'state' && stateInterval){ clearInterval(stateInterval); stateInterval = null; }
        renderTab(activeTab);
      });
    });

    toggle.addEventListener('click', function(){
      var hidden = panel.classList.contains('dbg-hidden');
      panel.classList.toggle('dbg-hidden', !hidden);
      if(hidden){ renderTab(activeTab); }
      else{ if(stateInterval){ clearInterval(stateInterval); stateInterval = null; } }
    });

    document.getElementById('dbg-close-btn').addEventListener('click', function(){
      panel.classList.add('dbg-hidden');
      if(stateInterval){ clearInterval(stateInterval); stateInterval = null; }
    });

    function renderTab(tab){
      var body = document.getElementById('dbg-body');
      if(!body) return;
      if(tab !== 'state' && stateInterval){ clearInterval(stateInterval); stateInterval = null; }
      try{
        if(tab === 'fixture')      renderFixtureTab(body);
        else if(tab === 'stepper') renderStepperTab(body);
        else if(tab === 'state')  { renderStateTab(body); startStateRefresh(); }
        else if(tab === 'persist') renderPersistTab(body);
        else if(tab === 'tests')   renderTestsTab(body);
      }catch(e){ console.error('Folio Debug renderTab:', e); }
    }

    // ════════════════════════════════
    // TAB 1 — FIXTURE
    // ════════════════════════════════
    function renderFixtureTab(body){
      body.innerHTML =
        '<div class="dbg-section">' +
          '<div class="dbg-lbl">Sentence count</div>' +
          '<div class="dbg-row">' +
            '<select class="dbg-sel" id="dbg-sent-count">' +
              '<option value="10">10</option>' +
              '<option value="25" selected>25</option>' +
              '<option value="50">50</option>' +
              '<option value="100">100</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
        '<div class="dbg-section">' +
          '<div class="dbg-lbl">Mode</div>' +
          '<div class="dbg-row">' +
            '<select class="dbg-sel" id="dbg-mode">' +
              '<option value="tts">TTS</option>' +
              '<option value="audio">Audio (fake)</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
        '<div class="dbg-section">' +
          '<div class="dbg-row">' +
            '<button class="dbg-btn" id="dbg-inject-btn">Inject Fixture Book</button>' +
            '<button class="dbg-btn dbg-danger" id="dbg-clear-btn">Clear All Books</button>' +
          '</div>' +
        '</div>';

      document.getElementById('dbg-inject-btn').addEventListener('click', function(){
        try{
          var sentCount = parseInt(document.getElementById('dbg-sent-count').value) || 25;
          var mode = document.getElementById('dbg-mode').value;
          var lines = [];
          for(var i = 0; i < sentCount; i++){
            lines.push('Sentence ' + (i+1) + ' of ' + sentCount + ' in this debug fixture, containing word number ' + ((i*4)+1) + ' through ' + ((i*4)+4) + '.');
          }
          var ebookData = lines.join('\n');
          var book = {
            id: uid(),
            title: 'Debug Fixture \u2014 ' + sentCount + ' sentences',
            audioUrl: null,
            audioName: null,
            ebookName: 'fixture.txt',
            ebookData: ebookData,
            ebookType: 'txt',
            transcriptName: null,
            transcriptType: null,
            transcriptData: null,
            coverUrl: null,
            coverName: null,
            curSent: 0,
            curWord: 0,
            audioTime: 0,
            wpm: 150,
            sentPauseMs: 500,
            playbackRate: 1,
            totalSents: sentCount,
          };
          library.push(book);
          saveLibrary();
          renderLib();
          openBook(library.length - 1);
          if(mode === 'audio'){
            var _dbgPoll = setInterval(function(){
              try{
                if(!sentences.length) return;
                clearInterval(_dbgPoll);
                _dbgPoll = null;
                // Populate fake timings
                sentenceTimings = sentences.map(function(_, i){ return { start: i * 2, end: (i + 1) * 2 - 0.1 }; });
                // configurePlayerForMode set ttsMode=true because audioUrl is null.
                // Override to audio-mode UI so the seek strip is visible.
                ttsMode = false;
                var ss = document.getElementById('seekStrip');
                if(ss) ss.style.display = '';
                var tb = document.getElementById('ttsBar');
                if(tb) tb.style.display = 'none';
                var spd = document.querySelector('.speed-strip');
                if(spd) spd.style.display = '';
                var rpw = document.querySelector('.read-progress-wrap');
                if(rpw) rpw.classList.remove('scrubbing');
                updateHL();
              }catch(ex){ clearInterval(_dbgPoll); _dbgPoll = null; console.error('Folio Debug fake timings:', ex); }
            }, 50);
            setTimeout(function(){ if(_dbgPoll){ clearInterval(_dbgPoll); _dbgPoll = null; } }, 5000);
          }
          showToast('Fixture injected (' + sentCount + ' sentences)', 'success');
        }catch(e){ console.error('Folio Debug inject:', e); }
      });

      document.getElementById('dbg-clear-btn').addEventListener('click', function(){
        try{
          if(!window.confirm('Delete ALL books? This cannot be undone.')) return;
          library.forEach(function(b){ if(b.audioUrl){ try{ URL.revokeObjectURL(b.audioUrl); }catch(ex){} } });
          library.length = 0;
          saveLibrary();
          renderLib();
          showToast('All books cleared');
        }catch(e){ console.error('Folio Debug clear:', e); }
      });
    }

    // ════════════════════════════════
    // TAB 2 — STEPPER
    // ════════════════════════════════
    function renderStepperTab(body){
      var isTts = typeof ttsMode !== 'undefined' ? ttsMode : false;
      var curSentVal = typeof curSent !== 'undefined' ? curSent : 0;
      var soVal = typeof syncOffset !== 'undefined' ? ((syncOffset >= 0 ? '+' : '') + syncOffset.toFixed(1) + 's') : '0.0s';

      body.innerHTML =
        '<div class="dbg-section">' +
          '<div class="dbg-lbl">Jump to sentence</div>' +
          '<div class="dbg-row">' +
            '<input type="number" class="dbg-num" id="dbg-jump-input" value="' + curSentVal + '" min="0" style="width:70px">' +
            '<button class="dbg-btn" id="dbg-jump-btn">Go</button>' +
          '</div>' +
        '</div>' +
        '<div class="dbg-section">' +
          '<div class="dbg-lbl">Step</div>' +
          '<div class="dbg-row">' +
            '<button class="dbg-btn" id="dbg-step-m10">\u00ab \u221210</button>' +
            '<button class="dbg-btn" id="dbg-step-m1">\u2039 \u22121</button>' +
            '<button class="dbg-btn" id="dbg-step-p1">+1 \u203a</button>' +
            '<button class="dbg-btn" id="dbg-step-p10">+10 \u00bb</button>' +
          '</div>' +
        '</div>' +
        '<div class="dbg-section">' +
          '<div class="dbg-lbl">Simulate audio time <span style="color:var(--text3);font-weight:400">(needs fake timings)</span></div>' +
          '<div class="dbg-row">' +
            '<input type="range" class="dbg-slider" id="dbg-audio-slider" min="0" max="100" value="0">' +
            '<span id="dbg-audio-time" style="font-size:11px;color:var(--text3);white-space:nowrap;min-width:36px">0.0s</span>' +
          '</div>' +
        '</div>' +
        (isTts ?
          '<div class="dbg-section">' +
            '<div class="dbg-lbl">TTS controls</div>' +
            '<div class="dbg-row">' +
              '<button class="dbg-btn" id="dbg-tts-play">TTS Play</button>' +
              '<button class="dbg-btn" id="dbg-tts-pause">TTS Pause</button>' +
              '<button class="dbg-btn" id="dbg-tts-stop">TTS Stop</button>' +
            '</div>' +
          '</div>'
        : '') +
        '<div class="dbg-section">' +
          '<div class="dbg-lbl">Sync offset</div>' +
          '<div class="dbg-row">' +
            '<button class="dbg-btn" id="dbg-off-m5">\u22120.5</button>' +
            '<button class="dbg-btn" id="dbg-off-m1">\u22120.1</button>' +
            '<span id="dbg-offset-val" style="font-size:12px;min-width:48px;text-align:center;font-family:monospace">' + soVal + '</span>' +
            '<button class="dbg-btn" id="dbg-off-p1">+0.1</button>' +
            '<button class="dbg-btn" id="dbg-off-p5">+0.5</button>' +
          '</div>' +
        '</div>' +
        '<div class="dbg-section">' +
          '<div class="dbg-lbl">Word highlight test</div>' +
          '<div class="dbg-row">' +
            '<input type="number" class="dbg-num" id="dbg-word-input" value="0" min="0" style="width:70px">' +
            '<button class="dbg-btn" id="dbg-word-btn">Highlight Word N</button>' +
          '</div>' +
        '</div>';

      function requireBook(){
        if(curBookIdx === -1 || !sentences.length){
          showToast('No book open', 'error');
          return false;
        }
        return true;
      }

      function dbgRefreshState(){
        if(activeTab === 'state'){
          try{ renderStateTab(document.getElementById('dbg-body')); }catch(ex){}
        }
      }

      document.getElementById('dbg-jump-btn').addEventListener('click', function(){
        try{
          if(!requireBook()) return;
          var val = parseInt(document.getElementById('dbg-jump-input').value) || 0;
          curSent = Math.max(0, Math.min(sentences.length - 1, val));
          curWord = 0;
          updateHL(); updateProg(); scrollToSent(curSent);
          dbgRefreshState();
        }catch(e){ console.error('Folio Debug jump:', e); }
      });

      document.getElementById('dbg-step-m10').addEventListener('click', function(){ try{ if(!requireBook()) return; nudge(-10); dbgRefreshState(); }catch(e){ console.error(e); } });
      document.getElementById('dbg-step-m1').addEventListener('click',  function(){ try{ if(!requireBook()) return; nudge(-1);  dbgRefreshState(); }catch(e){ console.error(e); } });
      document.getElementById('dbg-step-p1').addEventListener('click',  function(){ try{ if(!requireBook()) return; nudge(1);   dbgRefreshState(); }catch(e){ console.error(e); } });
      document.getElementById('dbg-step-p10').addEventListener('click', function(){ try{ if(!requireBook()) return; nudge(10);  dbgRefreshState(); }catch(e){ console.error(e); } });

      document.getElementById('dbg-audio-slider').addEventListener('input', function(){
        try{
          var val = parseFloat(this.value);
          var t = val * 2;
          var el = document.getElementById('dbg-audio-time');
          if(el) el.textContent = t.toFixed(1) + 's';
          if(!sentenceTimings || !sentenceTimings.length) return;
          _audio.currentTime = t;
          resync();
          dbgRefreshState();
        }catch(e){ console.error('Folio Debug audio-slider:', e); }
      });

      if(isTts){
        document.getElementById('dbg-tts-play').addEventListener('click',  function(){ try{ ttsPlay();  dbgRefreshState(); }catch(e){ console.error(e); } });
        document.getElementById('dbg-tts-pause').addEventListener('click', function(){ try{ ttsPause(); dbgRefreshState(); }catch(e){ console.error(e); } });
        document.getElementById('dbg-tts-stop').addEventListener('click',  function(){ try{ ttsStop();  dbgRefreshState(); }catch(e){ console.error(e); } });
      }

      function updateOffsetDisp(){
        var el = document.getElementById('dbg-offset-val');
        if(el && typeof syncOffset !== 'undefined'){
          el.textContent = (syncOffset >= 0 ? '+' : '') + syncOffset.toFixed(1) + 's';
        }
      }
      document.getElementById('dbg-off-m5').addEventListener('click', function(){ try{ adjustOffset(-0.5); updateOffsetDisp(); dbgRefreshState(); }catch(e){ console.error(e); } });
      document.getElementById('dbg-off-m1').addEventListener('click', function(){ try{ adjustOffset(-0.1); updateOffsetDisp(); dbgRefreshState(); }catch(e){ console.error(e); } });
      document.getElementById('dbg-off-p1').addEventListener('click', function(){ try{ adjustOffset(0.1);  updateOffsetDisp(); dbgRefreshState(); }catch(e){ console.error(e); } });
      document.getElementById('dbg-off-p5').addEventListener('click', function(){ try{ adjustOffset(0.5);  updateOffsetDisp(); dbgRefreshState(); }catch(e){ console.error(e); } });

      document.getElementById('dbg-word-btn').addEventListener('click', function(){
        try{
          if(!requireBook()) return;
          var n = parseInt(document.getElementById('dbg-word-input').value) || 0;
          var maxW = (sentences[curSent] && sentences[curSent].words) ? sentences[curSent].words.length - 1 : 0;
          curWord = Math.max(0, Math.min(maxW, n));
          updateHL();
          dbgRefreshState();
        }catch(e){ console.error('Folio Debug word-hl:', e); }
      });
    }

    // ════════════════════════════════
    // TAB 3 — STATE
    // ════════════════════════════════
    function fmtV(v){
      if(v === null || v === undefined) return 'null';
      if(typeof v === 'number' && isNaN(v)) return 'NaN';
      return String(v);
    }

    function renderStateTab(body){
      try{
        var st  = typeof mediaState     !== 'undefined' ? mediaState : '?';
        var tm  = typeof ttsMode        !== 'undefined' ? ttsMode    : '?';
        var tsp = typeof ttsSpeaking    !== 'undefined' ? ttsSpeaking: '?';
        var cs  = typeof curSent        !== 'undefined' ? curSent    : '?';
        var sl  = typeof sentences      !== 'undefined' ? sentences.length : '?';
        var cw  = typeof curWord        !== 'undefined' ? curWord    : '?';
        var as_ = typeof autoScroll     !== 'undefined' ? autoScroll : '?';
        var so  = typeof syncOffset     !== 'undefined' ? syncOffset : '?';

        var hasAudio = typeof _audio !== 'undefined' && _audio;
        var act = hasAudio ? _audio.currentTime  : NaN;
        var adu = hasAudio ? _audio.duration      : NaN;
        var apd = hasAudio ? _audio.paused        : '?';
        var apr = hasAudio ? _audio.playbackRate  : '?';

        var stl = typeof sentenceTimings !== 'undefined' ? sentenceTimings.length : '?';
        var twc = typeof transcriptWords !== 'undefined' ? (transcriptWords ? transcriptWords.length : 'null') : '?';
        var wpmv= typeof wpm            !== 'undefined' ? wpm         : '?';
        var spm = typeof sentPauseMs    !== 'undefined' ? sentPauseMs : '?';

        var libl= typeof library        !== 'undefined' ? library.length : '?';
        var cbi = typeof curBookIdx     !== 'undefined' ? curBookIdx   : '?';
        var bkt = (typeof library !== 'undefined' && typeof curBookIdx !== 'undefined' && curBookIdx >= 0 && library[curBookIdx]) ? library[curBookIdx].title.slice(0, 30) : 'null';
        var isPwa = typeof IS_PWA !== 'undefined' ? IS_PWA : '?';
        var canFs = typeof CAN_FS !== 'undefined' ? CAN_FS : '?';

        // Anomaly detection
        var anom_stl  = (stl === 0) && (cbi >= 0) && (typeof sl === 'number' && sl > 0);
        var anom_sent = typeof cs === 'number' && typeof sl === 'number' && cs >= sl;
        var anom_play = st === 'playing' && tm === false && apd === true;

        function row(k, v, anomalous){
          return '<tr><td>' + k + '</td><td' + (anomalous ? ' class="dbg-anomaly"' : '') + '>' + fmtV(v) + '</td></tr>';
        }
        function sep(label){
          return '<tr><td colspan="2"><hr class="dbg-sep"></td></tr>' +
                 '<tr><td colspan="2" style="color:var(--text3);font-size:10px;padding:3px 4px 2px;text-transform:uppercase;letter-spacing:.1em">' + label + '</td></tr>';
        }

        body.innerHTML =
          '<table class="dbg-state-table">' +
            '<tr><td colspan="2" style="color:var(--text3);font-size:10px;padding:0 4px 3px;text-transform:uppercase;letter-spacing:.1em">Playback</td></tr>' +
            row('mediaState',          st) +
            row('ttsMode',             tm) +
            row('ttsSpeaking',         tsp) +
            row('curSent',             cs + ' / ' + sl, anom_sent) +
            row('curWord',             cw) +
            row('autoScroll',          as_) +
            row('syncOffset',          so) +
            sep('Audio') +
            row('currentTime',         isFinite(act) ? act.toFixed(2) : '\u2014') +
            row('duration',            isFinite(adu) ? adu.toFixed(2) : '\u2014') +
            row('paused',              apd, anom_play) +
            row('playbackRate',        apr) +
            sep('Timing') +
            row('sentenceTimings.len', stl, anom_stl) +
            row('transcriptWords',     twc) +
            row('wpm',                 wpmv) +
            row('sentPauseMs',         spm) +
            sep('Library') +
            row('library.length',      libl) +
            row('curBookIdx',          cbi) +
            row('title',               bkt) +
            row('IS_PWA',              isPwa) +
            row('CAN_FS',              canFs) +
          '</table>';
      }catch(e){ console.error('Folio Debug renderStateTab:', e); }
    }

    function startStateRefresh(){
      if(stateInterval) clearInterval(stateInterval);
      stateInterval = setInterval(function(){
        try{
          if(activeTab === 'state' && !panel.classList.contains('dbg-hidden')){
            renderStateTab(document.getElementById('dbg-body'));
          } else {
            clearInterval(stateInterval);
            stateInterval = null;
          }
        }catch(e){}
      }, 500);
    }

    // ════════════════════════════════
    // TAB 4 — PERSIST
    // ════════════════════════════════
    function renderPersistTab(body){
      body.innerHTML =
        '<div class="dbg-section">' +
          '<div class="dbg-lbl">localStorage</div>' +
          '<div class="dbg-row">' +
            '<button class="dbg-btn" id="dbg-dump-ls">Dump LS</button>' +
            '<button class="dbg-btn dbg-danger" id="dbg-clear-ls">Clear LS</button>' +
            '<button class="dbg-btn" id="dbg-force-save">Force Save</button>' +
          '</div>' +
          '<div class="dbg-out" id="dbg-ls-out"></div>' +
        '</div>' +
        '<div class="dbg-section">' +
          '<div class="dbg-lbl">Progress</div>' +
          '<div class="dbg-row">' +
            '<button class="dbg-btn" id="dbg-dump-prog">Dump Progress</button>' +
            '<button class="dbg-btn" id="dbg-sim-pagehide">Simulate pagehide</button>' +
          '</div>' +
          '<div class="dbg-out" id="dbg-prog-out"></div>' +
        '</div>' +
        '<div class="dbg-section">' +
          '<div class="dbg-lbl">IndexedDB</div>' +
          '<div class="dbg-row">' +
            '<button class="dbg-btn" id="dbg-list-idb">List IDB Blobs</button>' +
            '<button class="dbg-btn dbg-danger" id="dbg-clear-idb">Clear IDB Blobs</button>' +
          '</div>' +
          '<div class="dbg-out" id="dbg-idb-out"></div>' +
        '</div>' +
        '<div class="dbg-section">' +
          '<div class="dbg-lbl">Display prefs</div>' +
          '<div class="dbg-row">' +
            '<button class="dbg-btn" id="dbg-dump-prefs">Dump Prefs</button>' +
            '<button class="dbg-btn dbg-danger" id="dbg-reset-prefs">Reset Prefs</button>' +
          '</div>' +
        '</div>';

      document.getElementById('dbg-dump-ls').addEventListener('click', function(){
        try{
          var raw = localStorage.getItem('folio_library_v2');
          console.log('[Folio Debug] folio_library_v2:', raw ? JSON.parse(raw) : null);
          document.getElementById('dbg-ls-out').textContent = (raw ? raw.length : 0) + ' chars \u2014 see console.';
        }catch(e){ console.error('Folio Debug dump-ls:', e); }
      });

      document.getElementById('dbg-clear-ls').addEventListener('click', function(){
        try{
          if(!window.confirm('Remove folio_library_v2 from localStorage?')) return;
          localStorage.removeItem('folio_library_v2');
          showToast('folio_library_v2 cleared');
          document.getElementById('dbg-ls-out').textContent = 'Cleared.';
        }catch(e){ console.error('Folio Debug clear-ls:', e); }
      });

      document.getElementById('dbg-force-save').addEventListener('click', function(){
        try{ saveLibrary(); showToast('Library saved', 'success'); }catch(e){ console.error('Folio Debug force-save:', e); }
      });

      document.getElementById('dbg-dump-prog').addEventListener('click', function(){
        try{
          var raw = localStorage.getItem('folio_pwa_progress_v1');
          var data = raw ? JSON.parse(raw) : null;
          console.log('[Folio Debug] folio_pwa_progress_v1:', data);
          var keyCount = data ? Object.keys(data).length : 0;
          document.getElementById('dbg-prog-out').textContent = keyCount + ' keys \u2014 see console.';
        }catch(e){ console.error('Folio Debug dump-prog:', e); }
      });

      document.getElementById('dbg-sim-pagehide').addEventListener('click', function(){
        try{
          window.dispatchEvent(new Event('pagehide'));
          showToast('pagehide dispatched');
        }catch(e){ console.error('Folio Debug sim-pagehide:', e); }
      });

      document.getElementById('dbg-list-idb').addEventListener('click', function(){
        try{
          var out = document.getElementById('dbg-idb-out');
          out.textContent = 'Loading\u2026';
          idbOpen().then(function(db){
            var tx = db.transaction(IDB_BLOB_STORE, 'readonly');
            var req = tx.objectStore(IDB_BLOB_STORE).openCursor();
            var lines = [];
            req.onsuccess = function(e){
              var cursor = e.target.result;
              if(!cursor){
                out.textContent = lines.length ? lines.join('\n') : 'No blobs.';
                return;
              }
              try{
                var val = cursor.value;
                var size = 0;
                if(val) Object.values(val).forEach(function(v){ if(typeof v === 'string') size += v.length; });
                lines.push(cursor.key + ': ~' + Math.round(size / 1024) + ' KB');
              }catch(ex){}
              cursor.continue();
            };
            req.onerror = function(){ out.textContent = 'Error reading IDB.'; };
          }).catch(function(e){ document.getElementById('dbg-idb-out').textContent = 'IDB error: ' + e.message; });
        }catch(e){ console.error('Folio Debug list-idb:', e); }
      });

      document.getElementById('dbg-clear-idb').addEventListener('click', function(){
        try{
          if(!window.confirm('Clear all IndexedDB blobs?')) return;
          idbOpen().then(function(db){
            var tx = db.transaction(IDB_BLOB_STORE, 'readwrite');
            tx.objectStore(IDB_BLOB_STORE).clear();
            tx.oncomplete = function(){ showToast('IDB blobs cleared', 'success'); document.getElementById('dbg-idb-out').textContent = 'Cleared.'; };
            tx.onerror   = function(){ showToast('IDB clear failed', 'error'); };
          }).catch(function(e){ console.error('Folio Debug clear-idb:', e); });
        }catch(e){ console.error('Folio Debug clear-idb:', e); }
      });

      document.getElementById('dbg-dump-prefs').addEventListener('click', function(){
        try{
          var raw = localStorage.getItem('folio_display_prefs_v1');
          console.log('[Folio Debug] folio_display_prefs_v1:', raw ? JSON.parse(raw) : null);
          showToast('Prefs dumped to console');
        }catch(e){ console.error('Folio Debug dump-prefs:', e); }
      });

      document.getElementById('dbg-reset-prefs').addEventListener('click', function(){
        try{
          if(!window.confirm('Reset display prefs to defaults?')) return;
          localStorage.removeItem('folio_display_prefs_v1');
          loadDisplayPrefs();
          showToast('Display prefs reset');
        }catch(e){ console.error('Folio Debug reset-prefs:', e); }
      });
    }

    // ════════════════════════════════
    // TAB 5 — TESTS
    // ════════════════════════════════
    function renderTestsTab(body){
      body.innerHTML =
        '<div class="dbg-section">' +
          '<div class="dbg-row">' +
            '<button class="dbg-btn" id="dbg-run-tests">&#9654; Run All Tests</button>' +
            '<span id="dbg-test-status" style="font-size:11px;color:var(--text3)"></span>' +
          '</div>' +
        '</div>' +
        '<div id="dbg-test-results"></div>';
      document.getElementById('dbg-run-tests').addEventListener('click', function(){
        runAllTests(document.getElementById('dbg-test-results'));
      });
    }

    function runAllTests(out){
      if(!out) return;
      out.innerHTML = '<div class="dbg-test-running">Running\u2026</div>';
      var statusEl = document.getElementById('dbg-test-status');
      if(statusEl) statusEl.textContent = '';

      var R = [];
      function okRow(name, pass, info){
        R.push({ name: name, pass: !!pass });
        var row = document.createElement('div');
        row.className = 'dbg-test-row ' + (pass ? 'dbg-test-pass' : 'dbg-test-fail');
        row.innerHTML =
          '<span class="dbg-test-icon">' + (pass ? '\u2713' : '\u2717') + '</span>' +
          '<span class="dbg-test-name">' + name + '</span>' +
          (info !== undefined && info !== '' ? '<span class="dbg-test-info">[' + info + ']</span>' : '');
        out.appendChild(row);
      }
      function ms(n){ return new Promise(function(r){ setTimeout(r, n); }); }
      function poll(fn, t){
        t = t || 4000;
        return new Promise(function(resolve){
          var end = Date.now() + t;
          function tick(){ if(fn()){ resolve(true); } else if(Date.now() >= end){ resolve(false); } else { setTimeout(tick, 50); } }
          tick();
        });
      }
      function setVal(id, v){ var el = document.getElementById(id); if(el) el.value = v; }
      function clickEl(id){ var el = document.getElementById(id); if(el) el.click(); }
      function tabClick(name){ var el = document.querySelector('.dbg-tab[data-tab="' + name + '"]'); if(el) el.click(); }
      var origConfirm = window.confirm;

      out.innerHTML = '';

      (async function(){
        try{
          // ── FIXTURE ──────────────────────────────────────────
          // TTS 10
          tabClick('fixture'); await ms(50);
          setVal('dbg-sent-count', '10');
          setVal('dbg-mode', 'tts');
          clickEl('dbg-inject-btn');
          await poll(function(){ return typeof sentences !== 'undefined' && sentences.length === 10; });
          okRow('TTS 10 — sentences.length = 10',      sentences.length === 10,       sentences.length);
          okRow('TTS 10 — ttsMode = true',             ttsMode === true);
          okRow('TTS 10 — sentenceTimings.len = 0',    sentenceTimings.length === 0,  sentenceTimings.length);
          var ss = document.getElementById('seekStrip');
          okRow('TTS 10 — seekStrip hidden',           ss && ss.style.display === 'none');
          var tb = document.getElementById('ttsBar');
          okRow('TTS 10 — ttsBar visible',             tb && tb.style.display !== 'none');

          // Audio fake 25
          tabClick('fixture'); await ms(50);
          setVal('dbg-sent-count', '25');
          setVal('dbg-mode', 'audio');
          clickEl('dbg-inject-btn');
          var audioOk = await poll(function(){ return ttsMode === false && sentenceTimings.length === 25; }, 6000);
          okRow('Audio 25 — poll resolved',            audioOk);
          okRow('Audio 25 — sentences.length = 25',   sentences.length === 25,        sentences.length);
          okRow('Audio 25 — ttsMode = false',          ttsMode === false);
          okRow('Audio 25 — sentenceTimings.len = 25', sentenceTimings.length === 25, sentenceTimings.length);
          ss = document.getElementById('seekStrip');
          okRow('Audio 25 — seekStrip visible',        ss && ss.style.display !== 'none');
          tb = document.getElementById('ttsBar');
          okRow('Audio 25 — ttsBar hidden',            tb && tb.style.display === 'none');

          // Sentence counts 50, 100
          for(var _n of [50, 100]){
            tabClick('fixture'); await ms(50);
            setVal('dbg-sent-count', String(_n));
            setVal('dbg-mode', 'tts');
            clickEl('dbg-inject-btn');
            await poll(function(){ return sentences.length === _n; });
            okRow('Sentence count ' + _n, sentences.length === _n, sentences.length);
          }

          // Clear All — cancel
          window.confirm = function(){ return false; };
          var libLen = library.length;
          clickEl('dbg-clear-btn'); await ms(50);
          window.confirm = origConfirm;
          okRow('Clear All cancel — no change', library.length === libLen, library.length);

          // Clear All — accept
          window.confirm = function(){ return true; };
          clickEl('dbg-clear-btn'); await ms(100);
          window.confirm = origConfirm;
          okRow('Clear All confirm — library empty', library.length === 0, library.length);
          okRow('Clear All confirm — LS empty array', (function(){
            try{ return JSON.parse(localStorage.getItem('folio_library_v2') || '[]').length === 0; }catch(e){ return false; }
          })());

          // Re-inject for stepper/state
          tabClick('fixture'); await ms(50);
          setVal('dbg-sent-count', '25');
          setVal('dbg-mode', 'audio');
          clickEl('dbg-inject-btn');
          await poll(function(){ return ttsMode === false && sentenceTimings.length === 25; }, 6000);

          // ── STEPPER ───────────────────────────────────────────
          tabClick('stepper'); await ms(100);

          setVal('dbg-jump-input', '5'); clickEl('dbg-jump-btn'); await ms(50);
          okRow('Jump 5 — curSent = 5 (0-based, 6th sentence)', curSent === 5, curSent);

          setVal('dbg-jump-input', '9999'); clickEl('dbg-jump-btn'); await ms(50);
          okRow('Jump 9999 — clamps to sentences.length-1', curSent === sentences.length - 1,
            curSent + ' / ' + (sentences.length - 1));

          setVal('dbg-jump-input', '0'); clickEl('dbg-jump-btn'); await ms(50);
          clickEl('dbg-step-m1'); await ms(50);
          okRow('Step -1 at 0 — stays at 0', curSent === 0, curSent);

          setVal('dbg-jump-input', String(sentences.length - 1)); clickEl('dbg-jump-btn'); await ms(50);
          clickEl('dbg-step-p10'); await ms(50);
          okRow('Step +10 at last — clamps', curSent === sentences.length - 1, curSent);

          setVal('dbg-jump-input', '10'); clickEl('dbg-jump-btn'); await ms(50);
          clickEl('dbg-step-p1');  await ms(50); okRow('Step +1',  curSent === 11, curSent);
          clickEl('dbg-step-m1');  await ms(50); okRow('Step -1',  curSent === 10, curSent);
          clickEl('dbg-step-p10'); await ms(50); okRow('Step +10', curSent === 20, curSent);
          clickEl('dbg-step-m10'); await ms(50); okRow('Step -10', curSent === 10, curSent);

          var off0 = syncOffset;
          clickEl('dbg-off-p1'); await ms(50);
          okRow('Offset +0.1', Math.abs(syncOffset - (off0 + 0.1)) < 0.001, syncOffset.toFixed(2));
          clickEl('dbg-off-p5'); await ms(50);
          okRow('Offset +0.5', Math.abs(syncOffset - (off0 + 0.6)) < 0.001, syncOffset.toFixed(2));
          clickEl('dbg-off-m5'); clickEl('dbg-off-m1'); await ms(50);

          setVal('dbg-jump-input', '5'); clickEl('dbg-jump-btn'); await ms(50);
          setVal('dbg-word-input', '2'); clickEl('dbg-word-btn'); await ms(50);
          okRow('Word highlight 2 — curWord = 2 (0-based, 3rd word)', curWord === 2, curWord);

          // ── STATE ─────────────────────────────────────────────
          tabClick('state'); await ms(600);
          var tbl = document.querySelector('.dbg-state-table');
          okRow('State — table rendered', !!tbl);
          var txt = tbl ? tbl.textContent : '';
          okRow('State — mediaState row',          txt.includes('mediaState'));
          okRow('State — ttsMode row',             txt.includes('ttsMode'));
          okRow('State — sentenceTimings.len row', txt.includes('sentenceTimings.len'));
          okRow('State — IS_PWA row',              txt.includes('IS_PWA'));
          okRow('State — curSent/total format',    /\d+ \/ \d+/.test(txt));

          var savedCS = curSent;
          curSent = sentences.length;
          tabClick('state'); await ms(600);
          okRow('Anomaly — curSent OOB → amber cell',
            !!document.querySelector('.dbg-state-table td.dbg-anomaly'));
          curSent = Math.min(savedCS, sentences.length - 1);
          if(typeof updateHL === 'function') updateHL();
          if(typeof updateProg === 'function') updateProg();

          // ── PERSIST ───────────────────────────────────────────
          tabClick('persist'); await ms(100);

          var saveCalled = false;
          var origSave = window.saveLibrary;
          window.saveLibrary = function(){ saveCalled = true; return origSave.apply(this, arguments); };
          clickEl('dbg-force-save'); await ms(50);
          window.saveLibrary = origSave;
          okRow('Force Save — saveLibrary called', saveCalled);

          var phFired = false;
          var phHandler = function(){ phFired = true; };
          window.addEventListener('pagehide', phHandler);
          clickEl('dbg-sim-pagehide'); await ms(50);
          window.removeEventListener('pagehide', phHandler);
          okRow('Simulate pagehide — event fired', phFired);

          clickEl('dbg-dump-ls'); await ms(50);
          okRow('Dump LS — char count shown', /chars/.test((document.getElementById('dbg-ls-out') || {}).textContent || ''));

          clickEl('dbg-dump-prog'); await ms(50);
          okRow('Dump Progress — key count shown', /keys/.test((document.getElementById('dbg-prog-out') || {}).textContent || ''));

          var lsBefore = localStorage.getItem('folio_library_v2');
          window.confirm = function(){ return false; };
          clickEl('dbg-clear-ls'); await ms(50);
          window.confirm = origConfirm;
          okRow('Clear LS cancel — key intact', localStorage.getItem('folio_library_v2') === lsBefore);

          var prefsBefore = localStorage.getItem('folio_display_prefs_v1');
          window.confirm = function(){ return false; };
          clickEl('dbg-reset-prefs'); await ms(50);
          window.confirm = origConfirm;
          okRow('Reset Prefs cancel — key intact', localStorage.getItem('folio_display_prefs_v1') === prefsBefore);

        }catch(ex){
          var errRow = document.createElement('div');
          errRow.style.cssText = 'color:#f85149;font-size:11px;padding:4px 0';
          errRow.textContent = 'Runner error: ' + ex.message;
          out.appendChild(errRow);
          console.error('Folio Test Runner:', ex);
        }

        // Summary
        tabClick('tests'); await ms(50);
        var pass = R.filter(function(r){ return r.pass; }).length;
        var fail = R.filter(function(r){ return !r.pass; }).length;
        var sum = document.createElement('div');
        sum.className = 'dbg-test-summary ' + (fail === 0 ? 'pass' : 'fail');
        sum.textContent = fail === 0
          ? '\u2713 All ' + pass + ' tests passed'
          : '\u2717 ' + pass + ' passed \u00b7 ' + fail + ' failed';
        out.appendChild(sum);
        if(statusEl) statusEl.textContent = fail === 0 ? pass + ' / ' + pass : pass + ' / ' + (pass + fail);
      })();
    }

    // Render initial tab content
    renderTab(activeTab);

    // Auto-run tests if ?test in URL
    if(location.search.includes('test')){
      panel.classList.remove('dbg-hidden');
      panel.querySelectorAll('.dbg-tab').forEach(function(b){ b.classList.remove('active'); });
      var testTabBtn = panel.querySelector('.dbg-tab[data-tab="tests"]');
      if(testTabBtn) testTabBtn.classList.add('active');
      activeTab = 'tests';
      renderTab('tests');
      setTimeout(function(){
        runAllTests(document.getElementById('dbg-test-results'));
      }, 300);
    }

  }catch(e){ console.error('Folio Debug Panel init error:', e); }
}
// ── DEBUG PANEL END ──
