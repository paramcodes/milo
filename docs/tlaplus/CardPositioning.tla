---- MODULE CardPositioning ----
EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS Cards

VARIABLES 
    clientOrder,    \* Sequence of cards representing client UI order
    dbPos,          \* Function from Cards -> Nat representing DB position
    inFlight        \* Set of pending messages from client to server

vars == <<clientOrder, dbPos, inFlight>>

\* Initial state: cards ordered in sequence, DB positions spaced by 1000
Init ==
    /\ clientOrder = << "c1", "c2", "c3" >>
    /\ dbPos = [c \in Cards |-> 
                  IF c = "c1" THEN 1000 
                  ELSE IF c = "c2" THEN 2000 
                  ELSE 3000]
    /\ inFlight = {}

\* MoveCard in Current Milo Implementation:
\* Client reorders locally using (index + 1) * 1000, but only sends movedCard's newPosition to server!
ClientDragCurrent(card, fromIdx, toIdx) ==
    /\ inFlight = {}
    /\ fromIdx \in 1..Len(clientOrder)
    /\ toIdx \in 1..Len(clientOrder)
    /\ fromIdx /= toIdx
    /\ clientOrder[fromIdx] = card
    /\ LET 
         withoutCard == SelectSeq(clientOrder, LAMBDA x: x /= card)
         newOrder == 
           IF toIdx = 1 THEN <<card>> \o withoutCard
           ELSE IF toIdx = Len(clientOrder) THEN Append(withoutCard, card)
           ELSE SubSeq(withoutCard, 1, toIdx - 1) \o <<card>> \o SubSeq(withoutCard, toIdx, Len(withoutCard))
         newPos == toIdx * 1000
       IN
         /\ clientOrder' = newOrder
         /\ inFlight' = {[card |-> card, newPos |-> newPos]}
         /\ UNCHANGED dbPos

\* Server updates ONLY the moved card's position (Milo's current updateCardPositionTx)
ServerProcessCurrent ==
    /\ inFlight /= {}
    /\ \E msg \in inFlight :
         /\ dbPos' = [dbPos EXCEPT ![msg.card] = msg.newPos]
         /\ inFlight' = inFlight \ {msg}
    /\ UNCHANGED clientOrder

Next ==
    \/ \E c \in Cards, f \in 1..3, t \in 1..3 : ClientDragCurrent(c, f, t)
    \/ ServerProcessCurrent

\* Safety Invariant: In DB, every card in the list must have a distinct position
UniquePositions ==
    \A c1, c2 \in Cards :
        c1 /= c2 => dbPos[c1] /= dbPos[c2]

Spec == Init /\ [][Next]_vars
====
