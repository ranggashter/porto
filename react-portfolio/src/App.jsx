import Particles from "./components/Background/Particles";
import profilePhoto from "./assets/hero.png";
import "./App.css";

function App() {
  return (
    <div className="page-shell">
      <div className="particles-layer" aria-hidden="true">
        <Particles
          particleColors={["#ffffff", "#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.2}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
          pixelRatio={1}
        />
      </div>

      <header className="topbar">
        <div className="brand">RANGGA</div>
        <nav className="nav" aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#projects">Projects</a>
        </nav>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero__content">
            <p className="eyebrow">HELLO, I'M</p>

            <h1 className="headline" aria-label="M. Rangga Dwi Pramudya">
              <span className="line">M. RANGGA DWI</span>
              <span className="line">PRAMUDYA</span>
            </h1>

            <p className="role">SOFTWARE ENGINEERING STUDENT</p>

            <p className="description">
              Building things with code,
              <br />
              learning something new.
            </p>

            <div className="meta" aria-label="Student profile details">
              <span>Siswa SMK</span>
              <span>•</span>
              <span>RPL</span>
              <span>•</span>
              <span>SMK PGRI 2 Ponorogo</span>
            </div>

            <button type="button" className="cta">
              VIEW PROJECTS
            </button>
          </div>
        </section>

        <section className="about" id="about">
          <div className="about__inner">
            <div className="about__header">
              <p className="section-label">ABOUT ME</p>
              <h2 className="about__heading">Learning by Building.</h2>
            </div>

            <div className="about__content">
              <div className="about__photo">
                <img
                  src={profilePhoto}
                  alt="Foto profil M. Rangga Dwi Pramudya"
                />
              </div>

              <div className="about__text">
                <p>
                  Saya adalah siswa Rekayasa Perangkat Lunak yang memiliki
                  ketertarikan pada pengembangan website, aplikasi, dan
                  teknologi.
                </p>
                <p>
                  Saya terus belajar dan mengembangkan kemampuan dalam berbagai
                  teknologi seperti JavaScript, React, PHP, Laravel,
                  CodeIgniter, MySQL, Flutter, dan REST API.
                </p>
                <p>
                  Saya senang membuat project untuk belajar, mencoba teknologi
                  baru, dan mengubah ide menjadi aplikasi yang dapat digunakan.
                </p>
              </div>

              <div className="about__details" aria-label="About details">
                <div className="detail-item">
                  <span className="detail-label">EDUCATION</span>
                  <span className="detail-value">SMK PGRI 2 Ponorogo</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">MAJOR</span>
                  <span className="detail-value">
                    Rekayasa Perangkat Lunak
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">FOCUS</span>
                  <span className="detail-value">Web &amp; Software Development</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">STATUS</span>
                  <span className="detail-value">Student</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;