import "./App.scss";
import styles from "./AppStyles.module.scss";
import MOLLEGrid from "./components/MOLLE/MOLLE";
import Toolbox from "./components/Toolbox/Toolbox";

function App() {
  return (
    <div className={styles.appstyles}>
      <div className={styles.mollegridcontainer}>
        <MOLLEGrid rows={4} columns={4} />
      </div>
      <div className={styles.toolbox}>
        <Toolbox />
      </div>
    </div>
  );
}

export default App;
