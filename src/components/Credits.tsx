import { useRef } from "react";

const SAMPLE_CREDITS = [
  { track: "Tram", creator: "ajvds", url: "https://freesound.org/people/ajvds/sounds/123990/" },
  { track: "Bike bell", creator: "Soundscape_Leuphana", url: "https://commons.wikimedia.org/wiki/File:Bicycle-bell-1.wav" },
  { track: "Cobbles", creator: "gecop", url: "https://freesound.org/people/gecop/sounds/528158/" },
  { track: "Canal", creator: "vero.marengere", url: "https://freesound.org/people/vero.marengere/sounds/524524/" },
  { track: "Carillon", creator: "Julien_Matthey", url: "https://freesound.org/people/Julien_Matthey/sounds/274987/" },
  { track: "Bridge", creator: "erilee", url: "https://freesound.org/people/erilee/sounds/108360/" },
];

export function Credits() {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <footer className="credits">
      <button type="button" className="credits-trigger" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>Credits</button>
      <dialog className="credits-dialog" aria-labelledby="credits-title" ref={dialog}
        onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
        <div className="credits-sheet">
          <header>
            <h2 id="credits-title">Credits</h2>
            <form method="dialog"><button className="switch" type="submit" autoFocus>Close</button></form>
          </header>
          <p><strong>Bo van Burken</strong> came up with the name sounds and the city.</p>
          <h3>Amsterdam field recordings</h3>
          <dl>
            {SAMPLE_CREDITS.map(({ track, creator, url }) => (
              <div key={track}><dt>{track}</dt><dd><a href={url} target="_blank" rel="noreferrer">{creator}</a></dd></div>
            ))}
          </dl>
          <p className="credits-license">All six field recordings are licensed <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">CC0 1.0</a>.</p>
        </div>
      </dialog>
    </footer>
  );
}
