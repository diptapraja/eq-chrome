# 🎬 TuneUP - Audio Equalizer & 5.1 Virtual Surround (Chrome Extension)

Ekstensi Google Chrome modern (Manifest V3) untuk meningkatkan kualitas audio tab aktif (seperti YouTube, Netflix, Spotify Web, Twitch, dll.) menjadi setara **Sistem Tata Suara Bioskop TuneUP 5.1 Virtual Surround Matrix**.

Dilengkapi dengan:
- **Dekoder Matriks 6 Kanal 5.1 (Pro Matrix Soundstage spec)**:
  - 🔊 **FL (Front Left)** & 🔊 **FR (Front Right)**: Panggung depan stereo yang presisi dengan *Complementary Crossover Management* agar tidak terjadi penumpukan bass ganda.
  - 🗣️ **Center Channel (C)**: Ekstraksi vokal dan dialog agar terdengar jernih di tengah layar.
  - 💥 **Subwoofer LFE (.1)**: Filter getaran frekuensi rendah $(<85\text{Hz})$ dengan kurva *24dB/octave Butterworth* ($Q=0.707$) untuk dentuman bass yang empuk, bulat, dan bebas dengung.
  - 🔊 **Surround Left (SL)** & 🔊 **Surround Right (SR)**: Ekstraksi efek panggung belakang dengan penundaan mikro *Haas* ($20\text{ms}$) dan *cinema rolloff*.
  - 🟢 **Sakelar Bass Bulat (Tight Bass Anti-Mud)**: Filter anti-mendem aktif di frekuensi $220\text{Hz}$ dan manajemen crossover di $85\text{Hz}$ yang membuang resonansi dengung tanpa mengurangi bobot dentuman, sehingga vokal dan instrumen tetap jernih terbuka.
- **10-Band Graphic Equalizer**: Rentang $\pm 12\text{ dB}$ pada 10 pita frekuensi.
- **Mixer 5.1 Surround Terpisah**: Grid 2x2 rapi untuk Center/Dialog, Subwoofer LFE, Rear Surround, dan Transient Attack.
- **Denah 6 Speaker Bioskop Interaktif**:
  - Denah visual 6 speaker 5.1 dengan lampu indikator audio.
  - Setiap speaker dapat diklik untuk **menguji posisi suaranya di telinga Anda**.
  - Tombol **"🎬 Tes Keliling 5.1"** untuk menyapu suara speaker satu per satu secara otomatis.
- **Radar Audio 3D & Animasi Kepala Pendengar (Top-Down)**:
  - Benda suara mengorbit $360^\circ$ mengelilingi kepala pendengar dengan indikator sudut real-time dan headphone yang menyala mengikuti posisi suara.
- **💎 Preset Unggulan "FLAC Studio Master HD"**:
  - Restorasi frekuensi tinggi *Air Band* ($16\text{ kHz}$ $+5.5\text{ dB}$) untuk mengembalikan kilau dan desah vokal yang terpotong oleh kompresi YouTube.
  - De-smearing respon transien ($22\text{ ms}$) agar pukulan instrumen terasa tajam dan renyah khas 24-bit studio master.
  - Bass bulat bertenaga ($80\text{ Hz}$ punch) dengan separasi panggung 5.1 yang luas.
- **Fitur Simpan Preset Kustom Fleksibel (Save & Save As)**:
  - **Preset Kustom**: Jika Anda mengubah setelan pada preset buatan Anda sendiri, muncul 2 tombol: **"Simpan"** (langsung mereplace konfigurasi preset tersebut) dan **"Simpan Sebagai..."** (menyimpan sebagai preset baru).
  - **Preset Bawaan**: Tombol "Simpan" (replace) diproteksi dan **tidak akan muncul** pada preset bawaan sistem (`Cinema 5.1`, `FLAC Master`, dll.), hanya muncul **"Simpan Sebagai..."** untuk mencegah preset standar tertimpa.
- **TuneUP Dynamic Range Compression (DRC)** & **Master Preamp Boost** (hingga 300%).

---

## 🚀 Cara Memasang / Memperbarui di Google Chrome

1. Buka browser **Google Chrome**.
2. Masuk ke halaman ekstensi:
   ```text
   chrome://extensions
   ```
3. Di pojok kanan atas, aktifkan sakelar **Developer mode** (Mode pengembang).
4. Klik tombol **Load unpacked** (atau jika sudah ada, klik tombol **Reload 🔄** pada kartu ekstensi).
5. Arahkan dan pilih folder:
   ```text
   /Users/dipta/Herd/equalizer
   ```
6. Ekstensi **TuneUP - Audio Equalizer & 5.1 Virtual Surround** siap dinikmati!

---

## 🎧 Cara Menggunakan Fitur 5.1 Surround

### 1. Mengaktifkan 5.1 pada Video YouTube:
1. Buka video YouTube (misalnya trailer film aksi 4K, video surround test, atau video musik).
2. Klik ikon ekstensi di toolbar Chrome.
3. Klik tombol **Power** (kanan atas) untuk mengaktifkan equalizer & matriks 5.1.
4. Pada tab **Equalizer & Presets**, Anda akan melihat bagian **TUNEUP 5.1 SURROUND MATRIX** (Grid 2x2 rapi):
   - Geser slider **Center / Dialog** untuk mengatur seberapa dominan dan jernih suara vokal percakapan.
   - Geser slider **Subwoofer (.1)** untuk mengatur kekuatan getaran bass bioskop.
   - Geser slider **Rear Surround** untuk memperlebar atau memperkuat suara efek dari belakang telinga Anda.
   - Geser slider **Transient Attack** (1ms - 100ms) untuk mengatur ketajaman respon pukulan suara agar tidak ada detail atau ketukan yang teredam/tertahan!

### 2. Menguji Masing-Masing Speaker 5.1:
1. Klik tab **"🌐 Simulasi 5.1 & 3D"** di bagian atas popup.
2. Anda akan melihat radar audio 3D dan denah **6 Speaker 5.1 Bioskop**:
   - Klik kotak speaker **FL** $\rightarrow$ Nada terdengar di kiri depan.
   - Klik kotak speaker **CENTER** $\rightarrow$ Nada terdengar tepat di tengah depan layar.
   - Klik kotak speaker **FR** $\rightarrow$ Nada terdengar di kanan depan.
   - Klik kotak speaker **SURR L** $\rightarrow$ Nada terdengar di kiri belakang.
   - Klik kotak speaker **SURR R** $\rightarrow$ Nada terdengar di kanan belakang.
   - Klik kotak speaker **SUB .1** $\rightarrow$ Nada getaran bass rendah berdentum di subwoofer.
3. Atau klik tombol **"🎬 Tes Keliling 5.1"** untuk mendengarkan urutan seluruh speaker mengelilingi kepala Anda secara otomatis!
