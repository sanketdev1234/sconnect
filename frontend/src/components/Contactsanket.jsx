import React from 'react';
import S from '../assets/S.webp';

function ContactSanket() {
    return (
        <div className="container-fluid py-5" style={{ 
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "white",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center"
        }}>
            <div className="container">
                <div className="row py-3 align-items-center">
                    <h2 className="col-md-12 text-center text-white fw-bold mb-5" style={{ 
                        fontSize: "3rem",
                        textShadow: "0 4px 8px rgba(0,0,0,0.3)",
                        background: "linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text"
                    }}>
                        Developer
                    </h2>
            
                    <div className="col-md-2"></div>

                    <div className="col-md-3 d-flex flex-column justify-content-center align-items-center gap-4">
                        <div style={{
                            position: "relative",
                            borderRadius: "50%",
                            padding: "8px",
                            background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)",
                            backdropFilter: "blur(10px)",
                            border: "2px solid rgba(255,255,255,0.3)",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.3), 0 8px 25px rgba(99, 102, 241, 0.4)"
                        }}>
                            <img
                                src={S}
                                alt="Sanket Zilpe - Developer"
                                className="img-fluid rounded-circle" 
                                style={{ 
                                    width: "200px",
                                    height: "200px",
                                    objectFit: "cover",
                                    border: "4px solid rgba(255,255,255,0.8)",
                                    boxShadow: "0 8px 25px rgba(0,0,0,0.3)"
                                }}
                            />
                        </div>
                        <div className="text-center">
                            <p className="fw-bold text-white mb-1" style={{ 
                                fontSize: "1.3rem",
                                textShadow: "0 2px 4px rgba(0,0,0,0.3)"
                            }}>
                                Sanket N. Zilpe
                            </p>
                            <p className="fw-medium text-white-75" style={{ 
                                fontSize: "1rem",
                                opacity: 0.9
                            }}>
                                IIIT Surat (Developer)
                            </p>
                            <p className="fw-medium text-white-75" style={{ 
                                fontSize: "0.9rem",
                                opacity: 0.8
                            }}>
                                CGPA: 9.22/10.0
                            </p>
                        </div>
                    </div>

                    <div className="col-md-1"></div>

                    <div className="col-md-5">
                        <div style={{
                            background: "rgba(255,255,255,0.1)",
                            backdropFilter: "blur(10px)",
                            borderRadius: "20px",
                            padding: "2rem",
                            border: "1px solid rgba(255,255,255,0.2)",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
                        }}>
                            <p className="fw-medium text-white-75 fs-5 mb-4" style={{ 
                                lineHeight: "1.8",
                                textShadow: "0 1px 2px rgba(0,0,0,0.3)"
                            }}>
                                Sanket is a passionate developer with strong expertise in full-stack development, currently pursuing B.Tech in Computer Science and Engineering at IIIT Surat with an impressive CGPA of 9.22/10.0. He has solved 400+ problems on LeetCode and 50+ problems on GeeksForGeeks, demonstrating exceptional problem-solving skills.
                            </p>
                            <p className="fw-medium text-white-75 fs-5 mb-4" style={{ 
                                lineHeight: "1.8",
                                textShadow: "0 1px 2px rgba(0,0,0,0.3)"
                            }}>
                                He is a Junior Developer at Google Developer Groups (IIIT Surat) and has developed several significant projects including S-Exchange (a real-time trading simulator) and PrimeStay (a travel blogging platform). His expertise spans React.js, Node.js, MongoDB, and various modern web technologies.
                            </p>
                            <div className="d-flex flex-column gap-3">
                                <span className="fw-bold text-warning fs-5" style={{
                                    textShadow: "0 2px 4px rgba(0,0,0,0.3)"
                                }}>
                                    Connect & Projects:
                                </span>
                                <div className="d-flex flex-wrap gap-3">
                                    <a href="mailto:sanketzilpe99@gmail.com" className="btn btn-outline-light btn-sm" style={{
                                        borderRadius: "25px",
                                        padding: "8px 20px",
                                        transition: "all 0.3s ease",
                                        border: "2px solid rgba(255,255,255,0.3)",
                                        background: "rgba(255,255,255,0.1)",
                                        backdropFilter: "blur(5px)"
                                    }}>
                                        <i className="bi bi-envelope me-2"></i>
                                        Email
                                    </a>
                                    <a href="https://www.linkedin.com/in/sanket-zilpe-89212928b/" target="_blank" rel="noopener noreferrer" className="btn btn-outline-light btn-sm" style={{
                                        borderRadius: "25px",
                                        padding: "8px 20px",
                                        transition: "all 0.3s ease",
                                        border: "2px solid rgba(255,255,255,0.3)",
                                        background: "rgba(255,255,255,0.1)",
                                        backdropFilter: "blur(5px)"
                                    }}>
                                        <i className="bi bi-linkedin me-2"></i>
                                        LinkedIn
                                    </a>
                                    <a href="https://github.com/sanketdev1234" target="_blank" rel="noopener noreferrer" className="btn btn-outline-light btn-sm" style={{
                                        borderRadius: "25px",
                                        padding: "8px 20px",
                                        transition: "all 0.3s ease",
                                        border: "2px solid rgba(255,255,255,0.3)",
                                        background: "rgba(255,255,255,0.1)",
                                        backdropFilter: "blur(5px)"
                                    }}>
                                        <i className="bi bi-github me-2"></i>
                                        GitHub
                                    </a>
                                    <a href="https://s-exchange-frontend.onrender.com/" target="_blank" rel="noopener noreferrer" className="btn btn-outline-light btn-sm" style={{
                                        borderRadius: "25px",
                                        padding: "8px 20px",
                                        transition: "all 0.3s ease",
                                        border: "2px solid rgba(255,255,255,0.3)",
                                        background: "rgba(255,255,255,0.1)",
                                        backdropFilter: "blur(5px)"
                                    }}>
                                        <i className="bi bi-link-45deg me-2"></i>
                                        S-Exchange
                                    </a>
                                    <a href="https://sanket-primestay-1.onrender.com" target="_blank" rel="noopener noreferrer" className="btn btn-outline-light btn-sm" style={{
                                        borderRadius: "25px",
                                        padding: "8px 20px",
                                        transition: "all 0.3s ease",
                                        border: "2px solid rgba(255,255,255,0.3)",
                                        background: "rgba(255,255,255,0.1)",
                                        backdropFilter: "blur(5px)"
                                    }}>
                                        <i className="bi bi-link-45deg me-2"></i>
                                        PrimeStay
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-1"></div>
                </div>
            </div>
        </div>
    );
}

export default ContactSanket;