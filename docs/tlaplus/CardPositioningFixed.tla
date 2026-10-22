---- MODULE CardPositioningFixed ----
EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS Cards

VARIABLES 
    clientOrder,    \* Sequence of cards representing client UI order
    dbPos,          \* Function from Cards -> Nat representing DB position
    inFlight        \* Set of pending messages containing full card order

vars == <<clientOrder, dbPos, inFlight>>

Init ==
    /\ clientOrder = << "c1", "c2", "c3" >>
    /\ dbPos = [c \in Cards |-> 
                  IF c = "c1" THEN 1000 
                  ELSE IF c = "c2" THEN 2000 
                  ELSE 3000]
    /\ inFlight = {}

\* Fixed Client: Sends entire reordered list of card IDs (or updates all shifted card positions)
ClientDragFixed(card, fromIdx, toIdx) ==
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
       IN
         /\ clientOrder' = newOrder
         /\ inFlight' = {[orderedCards |-> newOrder]}
         /\ UNCHANGED dbPos

\* Fixed Server: Updates all card positions in the list transactionally based on their new index
ServerProcessFixed ==
    /\ inFlight /= {}
    /\ \E msg \in inFlight :
         /\ dbPos' = [c \in Cards |-> 
                       LET idx == CHOOSE i \in 1..Len(msg.orderedCards) : msg.orderedCards[i] = c
                       IN idx * 1000]
         /\ inFlight' = inFlight \ {msg}
    /\ UNCHANGED clientOrder

Next ==
    \/ \E c \in Cards, f \in 1..3, t \in 1..3 : ClientDragFixed(c, f, t)
    \/ ServerProcessFixed

\* Safety Invariant: In DB, every card in the list must have a distinct position
UniquePositions ==
    \A c1, c2 \in Cards :
        c1 /= c2 => dbPos[c1] /= dbPos[c2]

\* Order Alignment: DB order matches client order once processed
OrderConsistent ==
    inFlight = {} =>
        \A i, j \in 1..Len(clientOrder) :
            i < j => dbPos[clientOrder[i]] < dbPos[clientOrder[j]]

Spec == Init /\ [][Next]_vars
====
