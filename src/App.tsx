import "./App.scss";
import styles from "./AppStyles.module.scss";
import MOLLEGrid from "./components/MOLLE/MOLLE";

function App() {
  return (
    <div>
      <div className={styles.mollegridcontainer}>
        <MOLLEGrid rows={4} columns={4} />
      </div>
    </div>
  );
}

export default App;
