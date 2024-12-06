import {useEffect, useRef, useState, forwardRef, useImperativeHandle} from "react";
import styles from './MainVideo.module.scss'
import {OPTIONS, getImgUrl, registerYouTubeIframeAPI} from './utils.js'
import MainVideoDialog from "./MainVideoDialog.jsx";

const MainVideo = forwardRef(({mainVideo, mainPlayerRef, mainPlayerIdRef, dialogPlayerRef, isLightMode}, ref) => {
  const containerRef = useRef(null);
  const videoInfoRef = useRef(null);
  const dialog = useRef(null);
  const ddddRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState(null);
  const [videoDetail, setVideoDetail] = useState({genres: []});
  const [videoCasts, setVideoCasts] = useState([]);
  const [similarVideos, setSimilarVideos] = useState([]);
  const [isPreview, setIsPreview] = useState(false);
  const [movieVideo, setMovieVideo] = useState(null);

  useImperativeHandle(ref, () => ({
    playMainVideo: () => {
      playVideo();
      hiddenBackGroundImage()
      document.body.classList.remove(styles['modal-open']); // 禁用背景滾動
    },
    pauseMainVideo: () => {
      pauseVideo();
      showBackGroundImage();
      document.body.classList.add(styles['modal-open']); // 禁用背景滾動
    }
  }))

  async function getMovieVideos() {
    let response = await fetch(`https://api.themoviedb.org/3/movie/${mainVideo.id}/videos?language=en-US`, OPTIONS)
    let data = await response.json()

    setMovieVideo(() => data.results[0])
    mainPlayerIdRef.current = data.results[0].key;

    if (! window.YT) {
      registerYouTubeIframeAPI(() => {
        createPlayer(data.results[0].key)
        dialog.current.registerYtAPI()
      })
    }

    const handleResize = () => {
      if (mainPlayerRef.current && containerRef.current) {
        const newWidth = containerRef.current.offsetWidth;
        mainPlayerRef.current.setSize(newWidth, (newWidth * 9) / 16);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }

  async function getImages() {
    let response = await fetch(`https://api.themoviedb.org/3/movie/${mainVideo.id}/images`, OPTIONS)
    let data = await response.json()

    setMainImage(getImgUrl(data.backdrops[0].file_path))
  }

  async function getMovieDetail() {
    let response = await fetch(`https://api.themoviedb.org/3/movie/${mainVideo.id}`, OPTIONS)
    let data = await response.json()

    setVideoDetail(data);
  }

  async function getMovieCasts() {
    let response = await fetch(`https://api.themoviedb.org/3/movie/${mainVideo.id}/credits?api_key=4c286b1e917ea42a64a67ebf38acbe7f`, OPTIONS)
    let data = await response.json()

    setVideoCasts(data.cast)
  }

  async function getSimilarVideos() {
    let response = await fetch(`https://api.themoviedb.org/3/movie/${mainVideo.id}/similar?api_key=4c286b1e917ea42a64a67ebf38acbe7f&language=en-US&page=1`, OPTIONS)
    let data = await response.json()

    setSimilarVideos(data.results)
  }

  async function fetchApi() {
    await Promise.all([
      getImages(),
      getMovieVideos(),
      getMovieDetail(),
      getMovieCasts(),
      getSimilarVideos()
    ]);

    setLoading(false);

    setTimeout(() => {
      setIsPreview(true)
    }, 2000);
  }

  useEffect(() => {
    fetchApi()
  }, [])

  useEffect(() => {
    if (containerRef.current) {
      registerYouTubeIframeAPI(() => {
        createPlayer(mainPlayerIdRef.current)
        dialog.current.registerYtAPI()
      })
    }
  }, [containerRef.current])

  function createPlayer(videoId) {
    mainPlayerRef.current = new window.YT.Player('youtube-player', {
      videoId: videoId, // 替換成你的影片 ID
      width: window.innerWidth,
      height: (window.innerWidth * 9) / 17,
      playerVars: {
        autoplay: 1, // 自動播放
        controls: 0, // 隱藏控制器
        modestbranding: 1, // 隱藏大型 YouTube 標誌
        rel: 1, // 不顯示相關影片
        fs: 0, // 隱藏全螢幕按鈕
        iv_load_policy: 3, // 隱藏註解
        mute: 1, // 靜音播放
        showinfo: 0
      },
      events: {
        onReady: (event) => {
          console.log('onReady')
          ddddRef.current = mainPlayerRef.current;
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.ENDED) {
            showBackGroundImage()
          }
        },
      },
    });
  }

  function hiddenBackGroundImage() {
    videoInfoRef.current.style.opacity = "0"
  }

  function showBackGroundImage() {
    videoInfoRef.current.style.opacity = "1"
  }

  function playVideo() {
    ddddRef.current.playVideo()
  }

  function pauseVideo() {
    ddddRef.current.pauseVideo()
  }

  function openModal() {
    dialog.current.showModal(); // 確保已綁定後調用 showModal
    dialog.current.playDialogVideo();

    pauseVideo();
    showBackGroundImage();
    document.body.classList.add(styles['modal-open']); // 禁用背景滾動
  }

  function closeModal() {
    dialog.current.closeModal();
    dialog.current.pauseDialogVideo();

    hiddenBackGroundImage();
    playVideo()
    document.body.classList.remove(styles['modal-open']); // 禁用背景滾動
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>
    <div ref={containerRef} className={styles.container}>
      <div id="youtube-player" style={{border: "none"}}></div>
      <div
        ref={videoInfoRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: (window.innerWidth * 9) / 16,
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${mainImage}')`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: "cover",
          backgroundPosition: 'center',
          opacity: "0",
          transition: 'opacity 0.5s ease'
        }}
      ></div>

      <div className={styles['main-info-cover']}>
        <div className={styles.dir} style={{
          width: window.innerWidth / 2,
          height: (window.innerWidth * 9) / 16,
        }}>
          <div className={`${styles['main-title']} ${isPreview ? styles['zoom-out'] : ''}`}>{mainVideo.title}</div>
          <h2 className={`${styles['main-release-day']} ${isPreview ? styles['hidden'] : ''}`}><strong>RELEASE
            DATE: {mainVideo.release_date}</strong></h2>
          <div className={`${styles['main-overview']} ${isPreview ? styles['hidden'] : ''}`}><em>{mainVideo.overview}</em></div>
          <div className={styles.buttons}>
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: 'lightgray',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px',
              }}
            >
              ▶ 播放
            </button>
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: 'gray',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onClick={openModal}
            >
              ⓘ 詳情
            </button>
          </div>
        </div>
      </div>
    </div>
    <MainVideoDialog ref={dialog}
            closeModal={closeModal}
            videoDetail={videoDetail}
            similarVideos={similarVideos}
            videoCasts={videoCasts}
            ytVideoId={movieVideo.key}
            isMain={true}
            mediaType="movie"
            dialogPlayerRef={dialogPlayerRef}
            isLightMode={isLightMode}
    />
  </>
})

export default MainVideo;