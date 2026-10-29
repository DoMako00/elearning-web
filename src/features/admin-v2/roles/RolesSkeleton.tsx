import { Skeleton } from "../../../components/ui/Skeleton";
import "./roles.css";

/* Same grid and classes as the loaded Roles & Permissions page. Rendered above MantineProvider: keep Mantine out. */
const bar = (width: number | string, height = 12) => <Skeleton width={width} height={height} borderRadius={4} />;

export function RolesSkeleton() {
  return <section className="admin-v2__page roles-v2" aria-busy="true" aria-label="Loading roles and permissions">
    <div className="roles-v2__grid">
      <div className="roles-v2__col">
        <section className="roles-v2__card roles-v2__setup">
          <header><Skeleton width={38} height={38} borderRadius={11} /><div style={{ display: "grid", gap: 7 }}>{bar(230, 17)}{bar(280, 12)}</div></header>
          <ol>{[0, 1, 2].map(index => <li key={index}><Skeleton width={24} height={24} circle /><div style={{ display: "grid", gap: 7, flex: 1 }}>{bar("70%", 14)}{bar("90%", 11)}</div></li>)}</ol>
          <div className="roles-v2__actions"><Skeleton width={170} height={38} borderRadius={10} /><Skeleton width={140} height={38} borderRadius={10} /></div>
        </section>
        <section className="roles-v2__card roles-v2__connect">
          <header><Skeleton width={38} height={38} borderRadius={11} /><div style={{ display: "grid", gap: 7 }}>{bar(220, 17)}{bar(260, 12)}</div></header>
          <div className="roles-v2__form">
            {[0, 1].map(index => <div className="roles-v2__field" key={index}>{bar(110, 13)}<Skeleton height={42} borderRadius={10} /></div>)}
            <div className="roles-v2__field is-wide">{bar(190, 13)}<Skeleton height={68} borderRadius={10} /></div>
            <div className="roles-v2__primary" style={{ background: "transparent" }}><Skeleton height={42} borderRadius={10} /></div>
          </div>
        </section>
      </div>
      <div className="roles-v2__col">
        <section className="roles-v2__card roles-v2__account">
          <header><Skeleton width={38} height={38} borderRadius={11} /><div style={{ display: "grid", gap: 7 }}>{bar(130, 11)}{bar(110, 17)}</div></header>
          {bar("85%", 14)}{bar(150, 14)}
        </section>
        <section className="roles-v2__card roles-v2__roles">
          <header><div style={{ display: "grid", gap: 7 }}>{bar(130, 17)}{bar(210, 12)}</div></header>
          <ul>{[0, 1].map(index => <li key={index}><Skeleton width={38} height={38} borderRadius={11} /><div style={{ display: "grid", gap: 7, flex: 1 }}>{bar("45%", 14)}{bar("85%", 11)}</div></li>)}</ul>
        </section>
        <section className="roles-v2__card roles-v2__advanced">{bar("70%", 16)}</section>
      </div>
    </div>
  </section>;
}
