import { MotionConfig } from 'motion/react'
import { createElement, Suspense, useEffect, useLayoutEffect } from 'react'
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useNavigate } from 'react-router'
import { useWorkflow } from '@/core/workflow/store'
import { UnconfirmedWarning } from '@/ui/UnconfirmedWarning'
import { scanBarcode, signOut } from './actions'
import { FocusOnNavigation } from './FocusOnNavigation'
import { resolveScreen } from './definition'
import { useExperienceId } from './experience'
import { useBarcode } from './hooks'
import { EXPERIENCES } from './registry'
import { allows, pathFor, primaryScreen, SCREENS, type ScreenId } from './routes'
import { useLastScan } from './scan'
import { SessionWatcher } from './SessionWatcher'

function ExperienceRoot() {
  const id = useExperienceId()
  const def = EXPERIENCES[id]
  useLayoutEffect(() => {
    document.documentElement.dataset.experience = id
  }, [id])
  const Effects = def.Effects
  return (
    <MotionConfig reducedMotion="user">
      <WorkflowNavigator />
      <FocusOnNavigation />
      <SessionWatcher />
      <BarcodeListener />
      <StepAwayWarning />
      {Effects && <Effects />}
      <Suspense fallback={<div className="grid h-full place-items-center text-ink-muted">Loading…</div>}>
        <Outlet />
      </Suspense>
    </MotionConfig>
  )
}

/** Moves the station to the right screen whenever the workflow changes state. */
function WorkflowNavigator() {
  const navigate = useNavigate()
  useEffect(
    () =>
      useWorkflow.subscribe((next, prev) => {
        if (next.state.name !== prev.state.name) navigate(pathFor(primaryScreen(next.state, prev.state)))
      }),
    [navigate],
  )
  return null
}

/** Barcode reads go to the list whenever the user is drawing, whatever the screen. */
function BarcodeListener() {
  const drawing = useWorkflow((s) => s.state.name === 'drawing')
  const set = useLastScan((s) => s.set)
  useBarcode((code) => {
    if (drawing) void scanBarcode(code).then(set)
  })
  return null
}

function StepAwayWarning() {
  const state = useWorkflow((s) => s.state)
  const send = useWorkflow((s) => s.send)
  const open = state.name === 'drawing' && state.unconfirmedWarning
  const count = state.name === 'drawing' ? state.cart.reduce((n, l) => n + l.qty, 0) : 0
  return <UnconfirmedWarning open={open} count={count} onContinue={() => send({ type: 'DISMISS_WARNING' })} onLeave={() => void signOut()} />
}

function ScreenRoute({ id }: { id: ScreenId }) {
  const state = useWorkflow((s) => s.state)
  const previous = useWorkflow((s) => s.previous)
  const def = EXPERIENCES[useExperienceId()]
  if (!allows(id, state)) return <Navigate to={pathFor(primaryScreen(state, previous ?? undefined))} replace />
  const Screen = resolveScreen(def, id)
  if (!Screen) return <Navigate to="/" replace />
  // Screens are module-level lazy components looked up by id, not created here.
  return createElement(Screen)
}

const router = createBrowserRouter([
  {
    element: <ExperienceRoot />,
    children: [
      ...(Object.keys(SCREENS) as ScreenId[]).map((id) => ({ path: SCREENS[id].path, element: <ScreenRoute id={id} /> })),
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
