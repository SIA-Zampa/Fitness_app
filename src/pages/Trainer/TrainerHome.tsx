import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { ClientManager } from '../../features/clients/ClientManager';
import { ExerciseLibraryPreview } from '../../features/exercises/ExerciseLibraryPreview';
import { WorkoutPlanExportPanel } from '../../features/import-export/WorkoutPlanExportPanel';
import { WorkoutExerciseAssignment } from '../../features/workout-plans/WorkoutExerciseAssignment';
import { WorkoutPlanManager } from '../../features/workout-plans/WorkoutPlanManager';
import { useEffect, useState } from 'react';

type TrainerSection = 'overview' | 'clients' | 'plans' | 'assignments' | 'exercises' | 'export';

const trainerSections: Array<{
  id: TrainerSection;
  label: string;
  description: string;
}> = [
  { id: 'overview', label: 'Dashboard', description: 'Riepilogo dei moduli disponibili.' },
  { id: 'clients', label: 'Clienti', description: 'Crea, archivia ed elimina clienti.' },
  { id: 'plans', label: 'Schede', description: 'Crea schede e giorni di allenamento.' },
  { id: 'assignments', label: 'Esercizi scheda', description: 'Assegna esercizi ai giorni.' },
  { id: 'exercises', label: 'Libreria', description: 'Consulta e crea esercizi.' },
  { id: 'export', label: 'Esporta', description: 'Scarica la scheda cliente in Excel.' },
];

export function TrainerHome() {
  function sectionFromHash(): TrainerSection {
    const section = window.location.hash.replace(/^#\//, '').split('/')[0];
    return trainerSections.some((item) => item.id === section) ? section as TrainerSection : 'overview';
  }
  const [activeSection, setActiveSection] = useState<TrainerSection>(sectionFromHash);
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const syncSection = () => {
      setActiveSection(sectionFromHash());
      setRoute(window.location.hash);
    };
    window.addEventListener('hashchange', syncSection);
    return () => window.removeEventListener('hashchange', syncSection);
  }, []);

  function selectSection(section: TrainerSection) {
    window.location.hash = `#/${section}`;
    setActiveSection(section);
    setRoute(window.location.hash);
  }

  return (
    <>
      {!route.startsWith('#/clients/') && <section className="module-tabs" aria-label="Sezioni personal trainer">
        {trainerSections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? 'secondary' : 'ghost'}
            onClick={() => selectSection(section.id)}
          >
            {section.label}
          </Button>
        ))}
      </section>}

      {activeSection === 'overview' && (
        <section className="dashboard-grid" aria-label="Dashboard personal trainer">
          {trainerSections
            .filter((section) => section.id !== 'overview')
            .map((section) => (
              <Card key={section.id}>
                <h2>{section.label}</h2>
                <p>{section.description}</p>
                <Button variant="secondary" onClick={() => selectSection(section.id)}>
                  Apri
                </Button>
              </Card>
            ))}
        </section>
      )}

      {activeSection === 'clients' && <ClientManager />}
      {activeSection === 'plans' && <WorkoutPlanManager />}
      {activeSection === 'assignments' && <WorkoutExerciseAssignment />}
      {activeSection === 'exercises' && <ExerciseLibraryPreview />}
      {activeSection === 'export' && <WorkoutPlanExportPanel />}
    </>
  );
}
